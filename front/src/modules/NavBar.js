import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Container, Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const NavBar = () => {
  return (
    <>
      {/* <Navbar style={{ backgroundColor: "#F78117", marginBottom: 24 }}>
        <Container>

        </Container>
      </Navbar> */}

      <Navbar
        style={{ backgroundColor: "#F78117", marginBottom: 24 }}
        variant="light"
      >
        <Container>
          <Navbar.Brand>TigerGraph Covid Data Project</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link>
              <Link to="/" style={{ textDecoration: "none", color: "gray" }}>
                Infection Spread
              </Link>
            </Nav.Link>

            <Nav.Link>
              <Link
                to="/second"
                style={{ textDecoration: "none", color: "gray" }}
              >
                Infection Analysis
              </Link>
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};

export default NavBar;
