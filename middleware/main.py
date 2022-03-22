from typing import Optional

from fastapi import FastAPI

import pyTigerGraph as tg

import config as Credential

from fastapi.middleware.cors import CORSMiddleware

import random

try:
    conn = tg.TigerGraphConnection(host=Credential.HOST, username=Credential.USERNAME, password=Credential.PASSWORD, graphname=Credential.GRAPHNAME)
    conn.apiToken = conn.getToken(conn.createSecret())
    app = FastAPI()
except Exception as e:
    import time
    print(e)
    time.sleep(50000)

origins = [
    "http://localhost:3000",
    "https://localhost:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}

#get all the patients from a city
@app.get("/patientCity/{patient_id}")
def getPatientCity(patient_id: int):
    try:
        query = conn.runInstalledQuery("patientInformation", {"p":patient_id})
        return query[2]['patient_city'][0]["v_id"]
    except Exception as e:
        print(e)
        return None

def getPatientInfo(patient_id):
    query = conn.runInstalledQuery("patientInformation", {"p":patient_id})
    country = query[1]['patient_country'][0]["v_id"]
    city = query[2]['patient_city'][0]["v_id"]
    birthyear = query[0]['Start'][0]["attributes"]['birth_year']
    infection = query[0]['Start'][0]["attributes"]['infection_case']
    sex = query[0]['Start'][0]["attributes"]['sex']
    return {
        "country": country,
        "city": city,
        "birth": birthyear,
        "infection": infection,
        "sex": sex,
    }


@app.get("/listPatients_Infected_By_no_extra_info/{patient_id}")
def readListPatients_Infected_By(patient_id: int,):
    try:
        query = conn.runInstalledQuery("listPatients_Infected_By", {"p":patient_id})

        return query[0]['Infected_Patients']
    except Exception as e:
        print(e)
        return []


#includes info about the "infector"
@app.get("/listPatients_Infected_By/{patient_id}")
def readListPatients_Infected_By(patient_id: int,):
    try:
        query = conn.runInstalledQuery("listPatients_Infected_By", {"p":patient_id})
        rootinfo = getPatientInfo(patient_id)
        gQuery = query[0]['Infected_Patients']
        children = []
        for id in gQuery:
            info = getPatientInfo(int(id))
            children.append({
            "children": [],
            "country": info['country'],
            "city": info['city'],
            "birth": info['birth'],
            "infection": info['infection'],
            "sex": info['sex'],
            "id": id,
            "name": id,

            })

        result = {
            "name": str(patient_id),
            "id": str(patient_id),
            "country": rootinfo['country'],
            "city": rootinfo['city'],
            "birth": rootinfo['birth'],
            "infection": rootinfo['infection'],
            "sex": rootinfo['sex'],
            "children": children,
            "style": {
                "fill": "#FFDBD9",
                "stroke":  "#FF6D67"
            }
        }


        return result
    except Exception as e:
        print(e)
        return None



#only has the people that were infected by the "infector"
@app.get("/onlyListPatients_Infected_By/{patient_id}")
def readListPatients_Infected_By(patient_id: int,):
    try:
        query = conn.runInstalledQuery("listPatients_Infected_By", {"p":patient_id})
        infected = query[0]['Infected_Patients']
        children = []
        for id in infected:

            info = getPatientInfo(int(id))
            children.append({
            "children": [],
            "country": info['country'],
            "city": info['city'],
            "birth": info['birth'],
            "infection": info['infection'],
            "sex": info['sex'],
            "id": id,
            
            "name": id,

            })


        return children
    except Exception as e:
        print(e)
        return []


#get patients from a city in a certain age range
@app.get("/patientsRange/{city_id}")
def patients_in_city(city_id: str, yearL: int = 1900, yearU: int = 2022):
    try:
        randomColor = "#"+''.join([random.choice('ABCDEF0123456789') for i in range(6)])
        query = conn.runInstalledQuery("PatientFrom", {"ci":city_id, "yearL": yearL, "yearU": yearU,})
        nodes = [{
                "id": city_id,
                "label": city_id,
                "category": "city",
                "groupId": city_id,

                "style": {
                    "fill": randomColor,
                }
                

            }]
        edges = []
        
     
        patient_ids = query[0]["patients_from_city"]
        patient_data = query[1]["Result"]
        for index, patient in enumerate(patient_ids):
            info = patient_data[index]["attributes"]
            nodes.append({
                "id": patient,
                "label": patient,
                "birth": info['birth_year'],
                "infection": info['infection_case'],
                "sex": info['sex'],
                "city": city_id,
                "category": "patient",
                "groupId": city_id,

                "style": {
                    "fill": randomColor,
                }
                

            })
            edges.append({
                "source": city_id,
                "target": patient,
      
                    })


        return {
            "nodes": nodes,
            "edges": edges,
        }
    except Exception as e:
        print(e)
        return []


#get all the cities in a country
@app.get("/citiesInCountry/{country_id}")
def patients_in_country(country_id: str, ):
    try:
        query = conn.runInstalledQuery("CitiesInCountry", {"ci":country_id})
        cities = []
        cityList = query[0]['Cities']
        for city in cityList:
            cities.append(city['v_id'])
        return cities



    except Exception as e:
        print(e)
        return []