from database import db_manager
from models import (
    PersonCreate, Person, UnitCreate, Unit, RoleCreate, Role,
    StudentCreate, Student, EmployeeCreate, Employee, TeacherCreate, Teacher,
    VisitorCreate, Visitor, BiometricCreate, Biometric, BiometricLogCreate, BiometricLog,
    PeopleBiometricsCreate, PeopleBiometrics,
    WebAccessLogCreate, WebAccessLog, BiometricLogCreate, BiometricLog
)
from typing import Optional, List, Dict, Any
import logging
import psycopg2.extras

logger = logging.getLogger(__name__)

class CRUDManager:
    def __init__(self):
        self.db = db_manager

    # --- Person CRUD ---
    def create_person(self, person: PersonCreate) -> Optional[Person]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Person" (full_name, birth_date, cpf, email, phone, type, main_unit_type, system_access_hash, temporary_password, password_reset_at, registration_unit_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, full_name, birth_date, cpf, email, phone, type, main_unit_type, system_access_hash, temporary_password, password_reset_at, registration_unit_id
                    """
                    cursor.execute(query, (
                        person.full_name, person.birth_date, person.cpf, person.email, person.phone,
                        person.type.value, person.main_unit_type.value, person.system_access_hash, person.temporary_password,
                        person.password_reset_at, person.registration_unit_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Person(id=result[0], full_name=result[1], birth_date=result[2], cpf=result[3], email=result[4], phone=result[5], type=result[6], main_unit_type=result[7], system_access_hash=result[8], temporary_password=result[9], password_reset_at=result[10], registration_unit_id=result[11])
            return None
        except Exception as e:
            logger.error(f"Error creating person: {e}")
            return None

    def get_person(self, person_id: int) -> Optional[Person]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, full_name, birth_date, cpf, email, phone, type, main_unit_type, system_access_hash, temporary_password, password_reset_at, registration_unit_id FROM \"Person\" WHERE id = %s"
                    cursor.execute(query, (person_id,))
                    result = cursor.fetchone()
                    if result:
                        return Person(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting person: {e}")
            return None

    def get_all_people(self) -> List[Person]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, full_name, birth_date, cpf, email, phone, type, main_unit_type, system_access_hash, temporary_password, password_reset_at, registration_unit_id FROM \"Person\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Person(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all people: {e}")
            return []

    def update_person(self, person_id: int, person: PersonCreate) -> Optional[Person]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Person" SET full_name = %s, birth_date = %s, cpf = %s, email = %s, phone = %s, type = %s, main_unit_type = %s, system_access_hash = %s, temporary_password = %s, password_reset_at = %s, registration_unit_id = %s
                    WHERE id = %s RETURNING id, full_name, birth_date, cpf, email, phone, type, main_unit_type, system_access_hash, temporary_password, password_reset_at, registration_unit_id
                    """
                    cursor.execute(query, (
                        person.full_name, person.birth_date, person.cpf, person.email, person.phone,
                        person.type.value, person.main_unit_type.value, person.system_access_hash, person.temporary_password,
                        person.password_reset_at, person.registration_unit_id, person_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Person(id=result[0], full_name=result[1], birth_date=result[2], cpf=result[3], email=result[4], phone=result[5], type=result[6], main_unit_type=result[7], system_access_hash=result[8], temporary_password=result[9], password_reset_at=result[10], registration_unit_id=result[11])
            return None
        except Exception as e:
            logger.error(f"Error updating person: {e}")
            return None

    def delete_person(self, person_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Person\" WHERE id = %s"
                    cursor.execute(query, (person_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting person: {e}")
            return False

    # --- Unit CRUD ---
    def create_unit(self, unit: UnitCreate) -> Optional[Unit]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Unit" (name, unit_type, address, phone, unit_code, is_extension)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, name, unit_type, address, phone, unit_code, is_extension
                    """
                    cursor.execute(query, (unit.name, unit.unit_type.value, unit.address, unit.phone, unit.unit_code, unit.is_extension))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Unit(id=result[0], name=result[1], unit_type=result[2], address=result[3], phone=result[4], unit_code=result[5], is_extension=result[6])
            return None
        except Exception as e:
            logger.error(f"Error creating unit: {e}")
            return None

    def get_unit(self, unit_id: int) -> Optional[Unit]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, name, unit_type, address, phone, unit_code, is_extension FROM \"Unit\" WHERE id = %s"
                    cursor.execute(query, (unit_id,))
                    result = cursor.fetchone()
                    if result:
                        return Unit(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting unit: {e}")
            return None

    def get_all_units(self) -> List[Unit]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, name, unit_type, address, phone, unit_code, is_extension FROM \"Unit\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Unit(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all units: {e}")
            return []

    def update_unit(self, unit_id: int, unit: UnitCreate) -> Optional[Unit]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Unit" SET name = %s, unit_type = %s, address = %s, phone = %s, unit_code = %s, is_extension = %s
                    WHERE id = %s RETURNING id, name, unit_type, address, phone, unit_code, is_extension
                    """
                    cursor.execute(query, (unit.name, unit.unit_type.value, unit.address, unit.phone, unit.unit_code, unit.is_extension, unit_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Unit(id=result[0], name=result[1], unit_type=result[2], address=result[3], phone=result[4], unit_code=result[5], is_extension=result[6])
            return None
        except Exception as e:
            logger.error(f"Error updating unit: {e}")
            return None

    def delete_unit(self, unit_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Unit\" WHERE id = %s"
                    cursor.execute(query, (unit_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting unit: {e}")
            return False

    # --- Role CRUD ---
    def create_role(self, role: RoleCreate) -> Optional[Role]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Role" (name, permission_level, description)
                    VALUES (%s, %s, %s) RETURNING id, name, permission_level, description
                    """
                    cursor.execute(query, (role.name, role.permission_level, role.description))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Role(id=result[0], name=result[1], permission_level=result[2], description=result[3])
            return None
        except Exception as e:
            logger.error(f"Error creating role: {e}")
            return None

    def get_role(self, role_id: int) -> Optional[Role]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, name, permission_level, description FROM \"Role\" WHERE id = %s"
                    cursor.execute(query, (role_id,))
                    result = cursor.fetchone()
                    if result:
                        return Role(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting role: {e}")
            return None

    def get_all_roles(self) -> List[Role]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, name, permission_level, description FROM \"Role\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Role(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all roles: {e}")
            return []

    def update_role(self, role_id: int, role: RoleCreate) -> Optional[Role]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Role" SET name = %s, permission_level = %s, description = %s
                    WHERE id = %s RETURNING id, name, permission_level, description
                    """
                    cursor.execute(query, (role.name, role.permission_level, role.description, role_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Role(id=result[0], name=result[1], permission_level=result[2], description=result[3])
            return None
        except Exception as e:
            logger.error(f"Error updating role: {e}")
            return None

    def delete_role(self, role_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Role\" WHERE id = %s"
                    cursor.execute(query, (role_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting role: {e}")
            return False

    # --- Student CRUD ---
    def create_student(self, student: StudentCreate) -> Optional[Student]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Student" (rm, period, course, class, responsible, status, person_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, rm, period, course, class, responsible, status, person_id
                    """
                    cursor.execute(query, (
                        student.rm, student.period.value, student.course, student.class_name, student.responsible,
                        student.status.value, student.person_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Student(id=result[0], rm=result[1], period=result[2], course=result[3], class_name=result[4], responsible=result[5], status=result[6], person_id=result[7])
            return None
        except Exception as e:
            logger.error(f"Error creating student: {e}")
            return None

    def get_student(self, student_id: int) -> Optional[Student]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, rm, period, course, class, responsible, status, person_id FROM \"Student\" WHERE id = %s"
                    cursor.execute(query, (student_id,))
                    result = cursor.fetchone()
                    if result:
                        return Student(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting student: {e}")
            return None

    def get_all_students(self) -> List[Student]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, rm, period, course, class, responsible, status, person_id FROM \"Student\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Student(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all students: {e}")
            return []

    def update_student(self, student_id: int, student: StudentCreate) -> Optional[Student]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Student" SET rm = %s, period = %s, course = %s, class = %s, responsible = %s, status = %s, person_id = %s
                    WHERE id = %s RETURNING id, rm, period, course, class, responsible, status, person_id
                    """
                    cursor.execute(query, (
                        student.rm, student.period.value, student.course, student.class_name, student.responsible,
                        student.status.value, student.person_id, student_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Student(id=result[0], rm=result[1], period=result[2], course=result[3], class_name=result[4], responsible=result[5], status=result[6], person_id=result[7])
            return None
        except Exception as e:
            logger.error(f"Error updating student: {e}")
            return None

    def delete_student(self, student_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Student\" WHERE id = %s"
                    cursor.execute(query, (student_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting student: {e}")
            return False

    # --- Employee CRUD ---
    def create_employee(self, employee: EmployeeCreate) -> Optional[Employee]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Employee" (registration_number, admission_date, active, person_id, role_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, registration_number, admission_date, active, person_id, role_id
                    """
                    cursor.execute(query, (
                        employee.registration_number, employee.admission_date, employee.active,
                        employee.person_id, employee.role_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Employee(id=result[0], registration_number=result[1], admission_date=result[2], active=result[3], person_id=result[4], role_id=result[5])
            return None
        except Exception as e:
            logger.error(f"Error creating employee: {e}")
            return None

    def get_employee(self, employee_id: int) -> Optional[Employee]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, registration_number, admission_date, active, person_id, role_id FROM \"Employee\" WHERE id = %s"
                    cursor.execute(query, (employee_id,))
                    result = cursor.fetchone()
                    if result:
                        return Employee(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting employee: {e}")
            return None

    def get_all_employees(self) -> List[Employee]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, registration_number, admission_date, active, person_id, role_id FROM \"Employee\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Employee(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all employees: {e}")
            return []

    def update_employee(self, employee_id: int, employee: EmployeeCreate) -> Optional[Employee]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Employee" SET registration_number = %s, admission_date = %s, active = %s, person_id = %s, role_id = %s
                    WHERE id = %s RETURNING id, registration_number, admission_date, active, person_id, role_id
                    """
                    cursor.execute(query, (
                        employee.registration_number, employee.admission_date, employee.active,
                        employee.person_id, employee.role_id, employee_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Employee(id=result[0], registration_number=result[1], admission_date=result[2], active=result[3], person_id=result[4], role_id=result[5])
            return None
        except Exception as e:
            logger.error(f"Error updating employee: {e}")
            return None

    def delete_employee(self, employee_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Employee\" WHERE id = %s"
                    cursor.execute(query, (employee_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting employee: {e}")
            return False

    # --- Teacher CRUD ---
    def create_teacher(self, teacher: TeacherCreate) -> Optional[Teacher]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Teacher" (teacher_id, subject, class_room, person_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, teacher_id, subject, class_room, person_id
                    """
                    cursor.execute(query, (teacher.teacher_id, teacher.subject, teacher.class_room, teacher.person_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Teacher(id=result[0], teacher_id=result[1], subject=result[2], class_room=result[3], person_id=result[4])
            return None
        except Exception as e:
            logger.error(f"Error creating teacher: {e}")
            return None

    def get_teacher(self, teacher_id: int) -> Optional[Teacher]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, teacher_id, subject, class_room, person_id FROM \"Teacher\" WHERE id = %s"
                    cursor.execute(query, (teacher_id,))
                    result = cursor.fetchone()
                    if result:
                        return Teacher(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting teacher: {e}")
            return None

    def get_all_teachers(self) -> List[Teacher]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, teacher_id, subject, class_room, person_id FROM \"Teacher\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Teacher(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all teachers: {e}")
            return []

    def update_teacher(self, teacher_id: int, teacher: TeacherCreate) -> Optional[Teacher]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Teacher" SET teacher_id = %s, subject = %s, class_room = %s, person_id = %s
                    WHERE id = %s RETURNING id, teacher_id, subject, class_room, person_id
                    """
                    cursor.execute(query, (teacher.teacher_id, teacher.subject, teacher.class_room, teacher.person_id, teacher_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Teacher(id=result[0], teacher_id=result[1], subject=result[2], class_room=result[3], person_id=result[4])
            return None
        except Exception as e:
            logger.error(f"Error updating teacher: {e}")
            return None

    def delete_teacher(self, teacher_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Teacher\" WHERE id = %s"
                    cursor.execute(query, (teacher_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting teacher: {e}")
            return False

    # --- Visitor CRUD ---
    def create_visitor(self, visitor: VisitorCreate) -> Optional[Visitor]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Visitor" (company, visit_reason, registration_date, visit_expiry_date, person_id, responsible_employee_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, company, visit_reason, registration_date, visit_expiry_date, person_id, responsible_employee_id
                    """
                    cursor.execute(query, (
                        visitor.company, visitor.visit_reason, visitor.registration_date, visitor.visit_expiry_date,
                        visitor.person_id, visitor.responsible_employee_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Visitor(id=result[0], company=result[1], visit_reason=result[2], registration_date=result[3], visit_expiry_date=result[4], person_id=result[5], responsible_employee_id=result[6])
            return None
        except Exception as e:
            logger.error(f"Error creating visitor: {e}")
            return None

    def get_visitor(self, visitor_id: int) -> Optional[Visitor]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, company, visit_reason, registration_date, visit_expiry_date, person_id, responsible_employee_id FROM \"Visitor\" WHERE id = %s"
                    cursor.execute(query, (visitor_id,))
                    result = cursor.fetchone()
                    if result:
                        return Visitor(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting visitor: {e}")
            return None

    def get_all_visitors(self) -> List[Visitor]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, company, visit_reason, registration_date, visit_expiry_date, person_id, responsible_employee_id FROM \"Visitor\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Visitor(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all visitors: {e}")
            return []

    def update_visitor(self, visitor_id: int, visitor: VisitorCreate) -> Optional[Visitor]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Visitor" SET company = %s, visit_reason = %s, registration_date = %s, visit_expiry_date = %s, person_id = %s, responsible_employee_id = %s
                    WHERE id = %s RETURNING id, company, visit_reason, registration_date, visit_expiry_date, person_id, responsible_employee_id
                    """
                    cursor.execute(query, (
                        visitor.company, visitor.visit_reason, visitor.registration_date, visitor.visit_expiry_date,
                        visitor.person_id, visitor.responsible_employee_id, visitor_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Visitor(id=result[0], company=result[1], visit_reason=result[2], registration_date=result[3], visit_expiry_date=result[4], person_id=result[5], responsible_employee_id=result[6])
            return None
        except Exception as e:
            logger.error(f"Error updating visitor: {e}")
            return None

    def delete_visitor(self, visitor_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Visitor\" WHERE id = %s"
                    cursor.execute(query, (visitor_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting visitor: {e}")
            return False

    # --- Biometric CRUD ---
    def create_biometric(self, biometric: BiometricCreate) -> Optional[Biometric]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "Biometric" (template, finger, registration_date, device, registration_unit_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, template, finger, registration_date, device, registration_unit_id
                    """
                    cursor.execute(query, (
                        biometric.template, biometric.finger.value, biometric.registration_date, biometric.device,
                        biometric.registration_unit_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Biometric(id=result[0], template=result[1], finger=result[2], registration_date=result[3], device=result[4], registration_unit_id=result[5])
            return None
        except Exception as e:
            logger.error(f"Error creating biometric: {e}")
            return None

    def get_biometric(self, biometric_id: int) -> Optional[Biometric]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, template, finger, registration_date, device, registration_unit_id FROM \"Biometric\" WHERE id = %s"
                    cursor.execute(query, (biometric_id,))
                    result = cursor.fetchone()
                    if result:
                        return Biometric(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting biometric: {e}")
            return None

    def get_all_biometrics(self) -> List[Biometric]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, template, finger, registration_date, device, registration_unit_id FROM \"Biometric\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [Biometric(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all biometrics: {e}")
            return []

    def update_biometric(self, biometric_id: int, biometric: BiometricCreate) -> Optional[Biometric]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    UPDATE "Biometric" SET template = %s, finger = %s, registration_date = %s, device = %s, registration_unit_id = %s
                    WHERE id = %s RETURNING id, template, finger, registration_date, device, registration_unit_id
                    """
                    cursor.execute(query, (
                        biometric.template, biometric.finger.value, biometric.registration_date, biometric.device,
                        biometric.registration_unit_id, biometric_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return Biometric(id=result[0], template=result[1], finger=result[2], registration_date=result[3], device=result[4], registration_unit_id=result[5])
            return None
        except Exception as e:
            logger.error(f"Error updating biometric: {e}")
            return None

    def delete_biometric(self, biometric_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"Biometric\" WHERE id = %s"
                    cursor.execute(query, (biometric_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting biometric: {e}")
            return False

    # --- WebAccessLog CRUD ---
    def create_web_access_log(self, log: WebAccessLogCreate) -> Optional[WebAccessLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "WebAccessLog" (login_time, logout_time, session_duration_minutes, event_type, person_id, unit_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, login_time, logout_time, session_duration_minutes, event_type, person_id, unit_id
                    """
                    cursor.execute(query, (log.login_time, log.logout_time, log.session_duration_minutes, log.event_type.value, log.person_id, log.unit_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return WebAccessLog(id=result[0], login_time=result[1], logout_time=result[2], session_duration_minutes=result[3], event_type=result[4], person_id=result[5], unit_id=result[6])
            return None
        except Exception as e:
            logger.error(f"Error creating web access log: {e}")
            return None

    def get_web_access_log(self, log_id: int) -> Optional[WebAccessLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, login_time, logout_time, session_duration_minutes, event_type, person_id, unit_id FROM \"WebAccessLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    result = cursor.fetchone()
                    if result:
                        return WebAccessLog(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting web access log: {e}")
            return None

    def get_all_web_access_logs(self) -> List[WebAccessLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, login_time, logout_time, session_duration_minutes, event_type, person_id, unit_id FROM \"WebAccessLog\" ORDER BY login_time DESC"
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [WebAccessLog(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all web access logs: {e}")
            return []

    # --- BiometricLog CRUD ---
    def create_biometric_log(self, log: BiometricLogCreate) -> Optional[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "BiometricLog" (access_time, event_type, biometric_device, is_authorized, person_id, unit_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id
                    """
                    cursor.execute(query, (log.access_time, log.event_type.value, log.biometric_device, log.is_authorized, log.person_id, log.unit_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return BiometricLog(id=result[0], access_time=result[1], event_type=result[2], biometric_device=result[3], is_authorized=result[4], person_id=result[5], unit_id=result[6])
            return None
        except Exception as e:
            logger.error(f"Error creating biometric log: {e}")
            return None

    def get_biometric_log(self, log_id: int) -> Optional[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id FROM \"BiometricLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    result = cursor.fetchone()
                    if result:
                        return BiometricLog(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting biometric log: {e}")
            return None

    def get_all_biometric_logs(self) -> List[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id FROM \"BiometricLog\" ORDER BY access_time DESC"
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [BiometricLog(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all biometric logs: {e}")
            return []

    def delete_biometric_log(self, log_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"BiometricLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting biometric log: {e}")
            return False

    def delete_web_access_log(self, log_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"WebAccessLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting web access log: {e}")
            return False

    # --- PeopleBiometrics CRUD ---sociation Table) ---
    def create_people_biometrics(self, pb: PeopleBiometricsCreate) -> Optional[PeopleBiometrics]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "PeopleBiometrics" (person_id, biometric_id)
                    VALUES (%s, %s) RETURNING person_id, biometric_id
                    """
                    cursor.execute(query, (pb.person_id, pb.biometric_id))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return PeopleBiometrics(person_id=result[0], biometric_id=result[1])
            return None
        except Exception as e:
            logger.error(f"Error creating PeopleBiometrics: {e}")
            return None

    def delete_people_biometrics(self, person_id: int, biometric_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"PeopleBiometrics\" WHERE person_id = %s AND biometric_id = %s"
                    cursor.execute(query, (person_id, biometric_id))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting PeopleBiometrics: {e}")
            return False

    # --- BiometricLog CRUD ---
    def create_biometric_log(self, log: BiometricLogCreate) -> Optional[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                    INSERT INTO "BiometricLog" (access_time, event_type, biometric_device, is_authorized, person_id, unit_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id
                    """
                    cursor.execute(query, (
                        log.access_time, log.event_type.value, log.biometric_device, log.is_authorized,
                        log.person_id, log.unit_id
                    ))
                    result = cursor.fetchone()
                    conn.commit()
                    if result:
                        return BiometricLog(id=result[0], access_time=result[1], event_type=result[2], biometric_device=result[3], is_authorized=result[4], person_id=result[5], unit_id=result[6])
            return None
        except Exception as e:
            logger.error(f"Error creating biometric log: {e}")
            return None

    def get_biometric_log(self, log_id: int) -> Optional[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id FROM \"BiometricLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    result = cursor.fetchone()
                    if result:
                        return BiometricLog(**result)
            return None
        except Exception as e:
            logger.error(f"Error getting biometric log: {e}")
            return None

    def get_all_biometric_logs(self) -> List[BiometricLog]:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    query = "SELECT id, access_time, event_type, biometric_device, is_authorized, person_id, unit_id FROM \"BiometricLog\""
                    cursor.execute(query)
                    results = cursor.fetchall()
                    return [BiometricLog(**row) for row in results]
            return []
        except Exception as e:
            logger.error(f"Error getting all biometric logs: {e}")
            return []

    def delete_biometric_log(self, log_id: int) -> bool:
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = "DELETE FROM \"BiometricLog\" WHERE id = %s"
                    cursor.execute(query, (log_id,))
                    conn.commit()
                    return cursor.rowcount > 0
            return False
        except Exception as e:
            logger.error(f"Error deleting biometric log: {e}")
            return False

crud_manager = CRUDManager()

