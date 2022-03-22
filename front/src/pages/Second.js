import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import G6 from "@antv/g6";
import {
  InputGroup,
  FormControl,
  Button,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";

const Second = (props) => {
  const [cities, setCities] = useState();
  const [formattedList, setFormattedList] = useState();
  const [country, setCountry] = useState();
  const [container, setContainer] = useState();
  const [graph, setGraph] = useState();
  const [data, setData] = useState();
  const [lowerYear, setLowerYear] = useState();
  const [upperYear, setUpperYear] = useState();
  const [gender, setGender] = useState();

  useEffect(() => {
    setContainer(document.getElementById("container"));
  }, []);

  //instantiate the Graph
  useEffect(() => {
    if (container !== undefined) {
      const tooltip = new G6.Tooltip({
        itemTypes: ["node"],
        offsetX: 10,
        offsetY: 33,
        getContent(e) {
          if (e.item.getModel().category === "patient") {
            return `<div style='width: 180px;'>
            <h5> Patient Info </h5>
                <p> Infection: ${e.item.getModel().infection}<p>
                <p> Birth Year: ${e.item.getModel().birth}<p>
                <p> Sex: ${e.item.getModel().sex}<p>
                <p> City: ${e.item.getModel().city}<p>
                <p> People Infected: ${e.item.getModel().infected}<p>
            </div>`;
          } else {
            return `<div style='width: 180px;'>
            <h5> City Info </h5>
                <p> Name: ${e.item.getModel().label}<p>
            </div>`;
          }
        },
      });
      const width = 2410;
      const height = 980;
      const tempGraph = new G6.Graph({
        container: "container",
        width,
        height,
        // linkCenter: true,
        modes: {
          default: [
            "drag-canvas",
            "drag-node",
            "zoom-canvas",
            "activate-relations",
            "brush-select",
            "drag-group",
            {
              type: "click-select",
              trigger: "ctrl",
            },
          ],
        },
        layout: {
          type: "force",
          // center: [200, 200], // The center of the graph by default
          linkDistance: 50, // Edge length
          nodeStrength: 30,
          edgeStrength: 0.1,
          collideStrength: 0.8,
          preventOverlap: true,
          nodeSpacing: 50,
        },
        animate: true,
        defaultNode: {
          size: 80,
          labelCfg: {
            style: {
              fill: "#000",
            },
          },
        },
        defaultEdge: {
          style: {
            fill: "#e2e2e2",
            lineWidth: 5,
          },
        },
        plugins: [tooltip],
      });

      setGraph(tempGraph);
    }
  }, [container]);

  //re-renders the graph when our selected cities change
  useEffect(() => {
    if (container !== undefined) {
      graph.on("node:dblclick", (evt) => {
        const nodeItem = evt.item;
        if (nodeItem._cfg.model.category === "patient") {
          getInfected(nodeItem);
        }
      });
      graph.data(data);

      graph.node((node) => {
        if (node["category"] === "city") {
          node["type"] = "rect";

          node["size"] = 200;
        }
        return node;
      });
      graph.render();
    }
  }, [data]);

  //updates the list of available cities whenever the country selected gets changed
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/citiesInCountry/${country}`)
      .then((res) => {
        if (res.status === 200) {
          setCities(res.data);
          const citiesList = res.data.map((city) => ({
            value: city,
            label: city,
          }));
          setFormattedList(citiesList);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [country]);

  //filters the Graph based on birth year inputs
  const filterAge = () => {
    graph.changeData();
    graph.render();

    if (
      lowerYear !== undefined &&
      upperYear !== undefined &&
      lowerYear !== "" &&
      upperYear !== ""
    ) {
      const nodes = graph.getNodes();
      for (const index in nodes) {
        const birthyear = nodes[index]._cfg.model.birth;

        if (birthyear < lowerYear || birthyear > upperYear) {
          graph.hideItem(nodes[index]);
        }
      }
    }
  };

  //filters the Graph based on age inputs
  const filterGender = () => {
    graph.changeData();
    graph.render();

    if (gender !== undefined && gender !== "none") {
      const nodes = graph.getNodes();
      for (const index in nodes) {
        const sex = nodes[index]._cfg.model.sex;
        if (sex !== gender && sex !== undefined) {
          graph.hideItem(nodes[index]);
        }
      }
    }
  };

  //gets a list of patients from a city
  async function getPatientCity(id) {
    let patientsList = await axios
      .get(`http://127.0.0.1:8000/patientsRange/${id}`)
      .then((res) => {
        if (res.status === 200) {
          return res;
        }
      });
    return patientsList;
  }

  //gets the city that a patient is from
  async function city_of_patient(patient_id) {
    let city = await axios
      .get(`http://127.0.0.1:8000/patientCity/${patient_id}`)
      .then((res) => {
        if (res.status === 200) {
          return res;
        }
      });
    return city;
  }

  //takes all our current selected cities, gets the patients from them, and re-renders the graph
  const submitCities = (selection) => {
    const tempList = cities.map((city) => city.value);
    let tempNodes = [];
    let tempEdges = [];
    for (const index in tempList) {
      getPatientCity(tempList[index]).then((list) => {
        tempNodes = [...tempNodes, ...list.data["nodes"]];
        tempEdges = [...tempEdges, ...list.data["edges"]];

        setData({
          nodes: tempNodes,
          edges: tempEdges,
        });
      });
    }
  };

  //used mainly for getting the infected patients after the user double clicks on a patient node, which will also bring in other cities if there is cross-infection
  const getInfected = (nodeItem) => {
    axios
      .get(
        `http://127.0.0.1:8000/listPatients_Infected_By_no_extra_info/${nodeItem._cfg.id}`
      )
      .then((res) => {
        if (res.status === 200) {
          if (res.data.length === 0) {
            graph.updateItem(nodeItem, {
              infected: 0,
              style: {
                fill: "#90EE90",
              },
            });
            graph.refresh();
          } else {
            const nodeIds = graph.getNodes().map((node) => node._cfg.id);
            graph.updateItem(nodeItem, {
              infected: res.data.length,
              style: {
                fill: "red",
              },
            });
            let seenCities = [];
            for (const index in res.data) {
              if (nodeIds.includes(res.data[index])) {
                const tempEdge = {
                  source: nodeItem._cfg.id,
                  target: res.data[index],
                  style: {
                    stroke: "#FF7F7F",
                    lineWidth: 3,
                    endArrow: {
                      path: G6.Arrow.triangle(5, 10, 0), // Using the built-in edges for the path, parameters are the width, length, offset (0 by default, corresponds to d), respectively
                      d: 0,
                    },
                  },
                };

                graph.addItem("edge", tempEdge);
              } else {
                city_of_patient(parseInt(res.data[index])).then((data) => {
                  const city = data.data;
                  if (!seenCities.includes(city)) {
                    seenCities = [...seenCities, city];
                    getPatientCity(city).then((graphData) => {
                      const currentNodes = graph
                        .getNodes()
                        .map((node) => node._cfg.model);
                      const tempNodes = [
                        ...currentNodes,
                        ...graphData.data.nodes,
                      ];
                      const currentEdges = graph
                        .getEdges()
                        .map((edge) => edge._cfg.model);
                      const tempEdges = [
                        ...currentEdges,
                        ...graphData.data.edges,
                      ];
                      graph.changeData({
                        nodes: tempNodes,
                        edges: tempEdges,
                      });
                      graph.data({
                        nodes: tempNodes,
                        edges: tempEdges,
                      });
                      for (const index in res.data) {
                        const tempEdge = {
                          source: nodeItem._cfg.id,
                          target: res.data[index],
                          style: {
                            stroke: "#FF7F7F",
                            lineWidth: 3,
                            endArrow: {
                              path: G6.Arrow.triangle(5, 10, 0),
                              d: 0,
                            },
                          },
                        };
                        graph.addItem("edge", tempEdge);
                      }
                    });
                  }
                });
              }
            }
          }
        }
      });
  };

  //variables for the dropdown menu choices
  const countries = [
    { value: "Korea", label: "Korea" },
    { value: "United States", label: "United States" },
    { value: "Spain", label: "Spain" },
    { value: "Thailand", label: "Thailand" },
    { value: "Canada", label: "Canada" },
    { value: "Mongolia", label: "Mongolia" },
    { value: "China", label: "China" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "France", label: "France" },
    { value: "Switzerland", label: "Switzerland" },
  ];

  const genders = [
    { value: "none", label: "none" },
    { value: "male", label: "male" },
    { value: "female", label: "female" },
  ];
  return (
    <div style={{ border: "4mm ridge #e3e3e3", margin: 50 }}>
      <Container fluid className="mt-2">
        <Row>
          <Col>
            <InputGroup>
              <InputGroup.Text>Birth Year Range</InputGroup.Text>
              <FormControl
                aria-label="Lower Year"
                placeholder="Lower Year"
                value={lowerYear}
                onChange={(event) => setLowerYear(event.target.value)}
              />
              <FormControl
                aria-label="Last name"
                placeholder="Upper Year"
                value={upperYear}
                onChange={(event) => setUpperYear(event.target.value)}
              />

              <Button variant="outline-secondary" onClick={filterAge}>
                Submit
              </Button>
            </InputGroup>
          </Col>
          <Col>
            <InputGroup.Text>Country/Cities</InputGroup.Text>
            <Select
              name="Countries"
              options={countries}
              onChange={(event) => setCountry(event.value)}
              className="basic-multi-select "
              classNamePrefix="select"
            />
            <Select
              isMulti
              name="Cities"
              options={formattedList}
              onChange={(event) => setCities(event)}
              className="basic-multi-select "
              classNamePrefix="select"
            />
            <div className="justify-content-center">
              <Button
                variant="outline-secondary"
                id="button-addon2"
                onClick={submitCities}
              >
                Submit
              </Button>
            </div>
          </Col>
          <Col>
            <InputGroup>
              <InputGroup.Text>Gender</InputGroup.Text>
              <Select
                name="Gender"
                options={genders}
                onChange={(event) => setGender(event.value)}
                className="basic-multi-select "
                classNamePrefix="select"
              />

              <Button variant="outline-secondary" onClick={filterGender}>
                Submit
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </Container>
      <div id="container"></div>
    </div>
  );
};

export default Second;
