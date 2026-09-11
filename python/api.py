from fastapi import FastAPI, HTTPException, status
from typing import List, Optional
from models import (
    Person, PersonCreate, Unit, UnitCreate, Role, RoleCreate,
    Student, StudentCreate, Employee, EmployeeCreate, Teacher, TeacherCreate,
    Visitor, VisitorCreate, Biometric, BiometricCreate, BiometricLog, BiometricLogCreate,
    PeopleBiometrics, PeopleBiometricsCreate
)
from crud import crud_manager
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Biometric Access Control API")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Biometric Access Control API!"}

# --- Person Endpoints ---
@app.post("/people/", response_model=Person, status_code=status.HTTP_201_CREATED, tags=["People"])
async def create_person(person: PersonCreate):
    db_person = crud_manager.create_person(person)
    if not db_person:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating person")
    return db_person

@app.get("/people/", response_model=List[Person], tags=["People"])
async def read_people():
    return crud_manager.get_all_people()

@app.get("/people/{person_id}", response_model=Person, tags=["People"])
async def read_person(person_id: int):
    db_person = crud_manager.get_person(person_id)
    if db_person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return db_person

@app.put("/people/{person_id}", response_model=Person, tags=["People"])
async def update_person(person_id: int, person: PersonCreate):
    db_person = crud_manager.update_person(person_id, person)
    if db_person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found or update failed")
    return db_person

@app.delete("/people/{person_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["People"])
async def delete_person(person_id: int):
    if not crud_manager.delete_person(person_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
    return

# --- Unit Endpoints ---
@app.post("/units/", response_model=Unit, status_code=status.HTTP_201_CREATED, tags=["Units"])
async def create_unit(unit: UnitCreate):
    db_unit = crud_manager.create_unit(unit)
    if not db_unit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating unit")
    return db_unit

@app.get("/units/", response_model=List[Unit], tags=["Units"])
async def read_units():
    return crud_manager.get_all_units()

@app.get("/units/{unit_id}", response_model=Unit, tags=["Units"])
async def read_unit(unit_id: int):
    db_unit = crud_manager.get_unit(unit_id)
    if db_unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return db_unit

@app.put("/units/{unit_id}", response_model=Unit, tags=["Units"])
async def update_unit(unit_id: int, unit: UnitCreate):
    db_unit = crud_manager.update_unit(unit_id, unit)
    if db_unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found or update failed")
    return db_unit

@app.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Units"])
async def delete_unit(unit_id: int):
    if not crud_manager.delete_unit(unit_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return

# --- Role Endpoints ---
@app.post("/roles/", response_model=Role, status_code=status.HTTP_201_CREATED, tags=["Roles"])
async def create_role(role: RoleCreate):
    db_role = crud_manager.create_role(role)
    if not db_role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating role")
    return db_role

@app.get("/roles/", response_model=List[Role], tags=["Roles"])
async def read_roles():
    return crud_manager.get_all_roles()

@app.get("/roles/{role_id}", response_model=Role, tags=["Roles"])
async def read_role(role_id: int):
    db_role = crud_manager.get_role(role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role

@app.put("/roles/{role_id}", response_model=Role, tags=["Roles"])
async def update_role(role_id: int, role: RoleCreate):
    db_role = crud_manager.update_role(role_id, role)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found or update failed")
    return db_role

@app.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Roles"])
async def delete_role(role_id: int):
    if not crud_manager.delete_role(role_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return

# --- Student Endpoints ---
@app.post("/students/", response_model=Student, status_code=status.HTTP_201_CREATED, tags=["Students"])
async def create_student(student: StudentCreate):
    db_student = crud_manager.create_student(student)
    if not db_student:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating student")
    return db_student

@app.get("/students/", response_model=List[Student], tags=["Students"])
async def read_students():
    return crud_manager.get_all_students()

@app.get("/students/{student_id}", response_model=Student, tags=["Students"])
async def read_student(student_id: int):
    db_student = crud_manager.get_student(student_id)
    if db_student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return db_student

@app.put("/students/{student_id}", response_model=Student, tags=["Students"])
async def update_student(student_id: int, student: StudentCreate):
    db_student = crud_manager.update_student(student_id, student)
    if db_student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found or update failed")
    return db_student

@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Students"])
async def delete_student(student_id: int):
    if not crud_manager.delete_student(student_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return

# --- Employee Endpoints ---
@app.post("/employees/", response_model=Employee, status_code=status.HTTP_201_CREATED, tags=["Employees"])
async def create_employee(employee: EmployeeCreate):
    db_employee = crud_manager.create_employee(employee)
    if not db_employee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating employee")
    return db_employee

@app.get("/employees/", response_model=List[Employee], tags=["Employees"])
async def read_employees():
    return crud_manager.get_all_employees()

@app.get("/employees/{employee_id}", response_model=Employee, tags=["Employees"])
async def read_employee(employee_id: int):
    db_employee = crud_manager.get_employee(employee_id)
    if db_employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return db_employee

@app.put("/employees/{employee_id}", response_model=Employee, tags=["Employees"])
async def update_employee(employee_id: int, employee: EmployeeCreate):
    db_employee = crud_manager.update_employee(employee_id, employee)
    if db_employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or update failed")
    return db_employee

@app.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Employees"])
async def delete_employee(employee_id: int):
    if not crud_manager.delete_employee(employee_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return

# --- Teacher Endpoints ---
@app.post("/teachers/", response_model=Teacher, status_code=status.HTTP_201_CREATED, tags=["Teachers"])
async def create_teacher(teacher: TeacherCreate):
    db_teacher = crud_manager.create_teacher(teacher)
    if not db_teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating teacher")
    return db_teacher

@app.get("/teachers/", response_model=List[Teacher], tags=["Teachers"])
async def read_teachers():
    return crud_manager.get_all_teachers()

@app.get("/teachers/{teacher_id}", response_model=Teacher, tags=["Teachers"])
async def read_teacher(teacher_id: int):
    db_teacher = crud_manager.get_teacher(teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return db_teacher

@app.put("/teachers/{teacher_id}", response_model=Teacher, tags=["Teachers"])
async def update_teacher(teacher_id: int, teacher: TeacherCreate):
    db_teacher = crud_manager.update_teacher(teacher_id, teacher)
    if db_teacher is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found or update failed")
    return db_teacher

@app.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Teachers"])
async def delete_teacher(teacher_id: int):
    if not crud_manager.delete_teacher(teacher_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return

# --- Visitor Endpoints ---
@app.post("/visitors/", response_model=Visitor, status_code=status.HTTP_201_CREATED, tags=["Visitors"])
async def create_visitor(visitor: VisitorCreate):
    db_visitor = crud_manager.create_visitor(visitor)
    if not db_visitor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating visitor")
    return db_visitor

@app.get("/visitors/", response_model=List[Visitor], tags=["Visitors"])
async def read_visitors():
    return crud_manager.get_all_visitors()

@app.get("/visitors/{visitor_id}", response_model=Visitor, tags=["Visitors"])
async def read_visitor(visitor_id: int):
    db_visitor = crud_manager.get_visitor(visitor_id)
    if db_visitor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
    return db_visitor

@app.put("/visitors/{visitor_id}", response_model=Visitor, tags=["Visitors"])
async def update_visitor(visitor_id: int, visitor: VisitorCreate):
    db_visitor = crud_manager.update_visitor(visitor_id, visitor)
    if db_visitor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found or update failed")
    return db_visitor

@app.delete("/visitors/{visitor_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Visitors"])
async def delete_visitor(visitor_id: int):
    if not crud_manager.delete_visitor(visitor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
    return

# --- Biometric Endpoints ---
@app.post("/biometrics/", response_model=Biometric, status_code=status.HTTP_201_CREATED, tags=["Biometrics"])
async def create_biometric(biometric: BiometricCreate):
    db_biometric = crud_manager.create_biometric(biometric)
    if not db_biometric:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating biometric")
    return db_biometric

@app.get("/biometrics/", response_model=List[Biometric], tags=["Biometrics"])
async def read_biometrics():
    return crud_manager.get_all_biometrics()

@app.get("/biometrics/{biometric_id}", response_model=Biometric, tags=["Biometrics"])
async def read_biometric(biometric_id: int):
    db_biometric = crud_manager.get_biometric(biometric_id)
    if db_biometric is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biometric not found")
    return db_biometric

@app.put("/biometrics/{biometric_id}", response_model=Biometric, tags=["Biometrics"])
async def update_biometric(biometric_id: int, biometric: BiometricCreate):
    db_biometric = crud_manager.update_biometric(biometric_id, biometric)
    if db_biometric is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biometric not found or update failed")
    return db_biometric

@app.delete("/biometrics/{biometric_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Biometrics"])
async def delete_biometric(biometric_id: int):
    if not crud_manager.delete_biometric(biometric_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biometric not found")
    return

# --- PeopleBiometrics Endpoints ---
@app.post("/peoplebiometrics/", response_model=PeopleBiometrics, status_code=status.HTTP_201_CREATED, tags=["PeopleBiometrics"])
async def create_people_biometrics(pb: PeopleBiometricsCreate):
    db_pb = crud_manager.create_people_biometrics(pb)
    if not db_pb:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating PeopleBiometrics entry")
    return db_pb

@app.delete("/peoplebiometrics/{person_id}/{biometric_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["PeopleBiometrics"])
async def delete_people_biometrics(person_id: int, biometric_id: int):
    if not crud_manager.delete_people_biometrics(person_id, biometric_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PeopleBiometrics entry not found")
    return

# --- BiometricLog Endpoints ---
@app.post("/biometriclogs/", response_model=BiometricLog, status_code=status.HTTP_201_CREATED, tags=["BiometricLogs"])
async def create_biometric_log(log: BiometricLogCreate):
    db_log = crud_manager.create_biometric_log(log)
    if not db_log:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error creating biometric log")
    return db_log

@app.get("/biometriclogs/", response_model=List[BiometricLog], tags=["BiometricLogs"])
async def read_biometric_logs():
    return crud_manager.get_all_biometric_logs()

@app.get("/biometriclogs/{log_id}", response_model=BiometricLog, tags=["BiometricLogs"])
async def read_biometric_log(log_id: int):
    db_log = crud_manager.get_biometric_log(log_id)
    if db_log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biometric log not found")
    return db_log

@app.delete("/biometriclogs/{log_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["BiometricLogs"])
async def delete_biometric_log(log_id: int):
    if not crud_manager.delete_biometric_log(log_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biometric log not found")
    return

