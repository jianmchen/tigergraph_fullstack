import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import G6 from "@antv/g6";
import { InputGroup, FormControl, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const [covidData, setCovidData] = useState();
  const [patientID, setPatientID] = useState(4100000006);
  const [container, setContainer] = useState();
  const [graph, setGraph] = useState();
  const [inputText, changeInputText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setContainer(document.getElementById("container"));
  }, []);

  //instantiate the Graph
  useEffect(() => {
    if (container != undefined) {
      const tooltip = new G6.Tooltip({
        itemTypes: ["node"],
        offsetX: 140,
        offsetY: 33,
        getContent(e) {
          return `<div style='width: 180px;'>
          <h5> Patient Info </h5>
              <p> Infection: ${e.item.getModel().infection}<p>
              <p> Country: ${e.item.getModel().country}<p>
              <p> City: ${e.item.getModel().city}<p>
              <p> Birth Year: ${e.item.getModel().birth}<p>
              <p> Sex: ${e.item.getModel().sex}<p>
          </div>`;
        },
      });
      const width = 2140;
      const height = 980;
      const tempGraph = new G6.TreeGraph({
        container: "container",
        width,
        height,
        // linkCenter: true,
        modes: {
          default: [
            {
              type: "collapse-expand",
              onChange: function onChange(item, collapsed) {
                const data = item.get("model");
                data.collapsed = collapsed;
                return true;
              },
            },
            "drag-canvas",
            "zoom-canvas",
            "drag-node",
            "activate-relations",
          ],
        },
        defaultNode: {
          size: 55,
        },
        defaultEdge: {
          // ... Other properties for edges
          style: {
            lineWidth: 3,
            // ... Other style properties
          },
        },
        layout: {
          type: "dendrogram",
          direction: "RL",
          nodeSep: 10,
          rankSep: 300,
          radial: true,
          linkDistance: 20,
          preventOverlap: true,
        },
        plugins: [tooltip],
      });

      setGraph(tempGraph);
    }
  }, [container]);

  //get the initial patient info
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/listPatients_Infected_By/${patientID}`)
      .then((res) => {
        if (res.status === 200) {
          setLoading(false);
          if (res.data == undefined) {
            alert("Please enter a valid Patient ID");
          } else {
            setCovidData(res.data);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [graph]);

  //get a patient's data, which includes themselves and their infected patients
  const getPatientData = (id) => {
    axios
      .get(`http://127.0.0.1:8000/listPatients_Infected_By/${id}`)
      .then((res) => {
        if (res.status === 200) {
          if (res.data == undefined) {
            alert("Please enter a valid Patient ID");
          } else {
            setCovidData(res.data);
            setPatientID(id);
          }
        }
      });
  };

  //only get the patient's infected children
  const getInfected = (nodeItem) => {
    axios
      .get(
        `http://127.0.0.1:8000/onlyListPatients_Infected_By/${nodeItem._cfg.id}`
      )
      .then((res) => {
        if (res.status === 200) {
          const nodeIds = graph.getNodes().map((node) => node._cfg.id);
          const filteredData = res.data.filter(
            (node) => !nodeIds.includes(node.id)
          );

          if (res.data.length == 0) {
            graph.updateItem(nodeItem, {
              style: {
                fill: "#90EE90",
              },
            });
            graph.refresh();
            graph.fitView();
          } else if (nodeItem.getNeighbors().length == 1) {
            graph.updateItem(nodeItem, {
              children: filteredData,
              style: {
                fill: "red",
              },
            });
            graph.changeData();
            graph.fitView();
          }
        }
      });
  };

  //re-render the graph with new data every time we submit a new patient id
  useEffect(() => {
    if (covidData != undefined) {
      graph.data(covidData);
      graph.node(function (node) {
        return {
          label: `${node.name.slice(0, 3)}\n${node.name.slice(3)}`,
          size: node.children.length ? 52 : 50,
        };
      });
      graph.render();
      graph.fitView();
      graph.on("node:dblclick", (evt) => {
        const nodeItem = evt.item;
        if (nodeItem._cfg.model.children.length == 0) {
          getInfected(nodeItem);
        }
      });
      setLoading(false);
      if (typeof window !== "undefined")
        window.onresize = () => {
          if (!graph || graph.get("destroyed")) return;
          if (!container || !container.scrollWidth || !container.scrollHeight)
            return;
          graph.changeSize(container.scrollWidth, container.scrollHeight);
        };
    }
  }, [covidData]); //props.userId, entryList

  //updates the patient id stored when a user types in the input box
  const handleChange = (event) => {
    changeInputText(event.target.value);
  };

  //submits the patient id stored and calls the relevant functions to re-render the graph
  const submitPatient = (activityObj) => {
    setLoading(true);
    getPatientData(parseInt(inputText));
  };

  return (
    <div className="App">
      <InputGroup className="mb-3 w-25 mx-auto">
        <FormControl
          placeholder="Patient's ID"
          aria-label="Patient's ID"
          aria-describedby="basic-addon2"
          value={inputText}
          onChange={handleChange}
        />
        <Button
          variant="outline-secondary"
          id="button-addon2"
          onClick={submitPatient}
        >
          Submit
        </Button>
      </InputGroup>
      <div style={{ border: "4mm ridge #e3e3e3", margin: 50 }}>
        <h1>GSQL Query: listPatients_Infected_By({patientID})</h1>
        {loading ? (
          <Spinner
            animation="border"
            role="status"
            style={{ width: "10rem", height: "10rem" }}
            className="mt-5"
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          <div></div>
        )}
        <div id="container"></div>
      </div>
    </div>
  );
};

export default Home;
