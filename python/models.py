from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime, date
from enum import Enum

# Enums do schema.prisma
class UnitTypeEnum(str, Enum):
    Fatec = "Fatec"
    Etec = "Etec"

class FingerEnum(str, Enum):
    thumb_right = "thumb_right"
    index_right = "index_right"
    middle_right = "middle_right"
    ring_right = "ring_right"
    pinky_right = "pinky_right"
    thumb_left = "thumb_left"
    index_left = "index_left"
    middle_left = "middle_left"
    ring_left = "ring_left"
    pinky_left = "pinky_left"

class PersonTypeEnum(str, Enum):
    student = "student"
    teacher = "teacher"
    employee = "employee"
    coordinator = "coordinator"
    inspector = "inspector"
    visitor = "visitor"

class PeriodEnum(str, Enum):
    morning = "morning"
    afternoon = "afternoon"
    night = "night"
    integral = "integral"

class StudentStatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"
    transferred = "transferred"

class EventTypeEnum(str, Enum):
    entry = "entry"
    exit = "exit"

# Models

class UnitBase(BaseModel):
    name: str = Field(..., max_length=50)
    unit_type: UnitTypeEnum
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    unit_code: str = Field(..., max_length=6)
    is_extension: bool = False

class UnitCreate(UnitBase):
    pass

class Unit(UnitBase):
    id: int

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    permission_level: int = 0
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True

class PersonBase(BaseModel):
    full_name: str = Field(..., max_length=100)
    birth_date: Optional[date] = None
    cpf: str = Field(..., max_length=14)
    email: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    type: PersonTypeEnum
    main_unit_type: UnitTypeEnum
    system_access_hash: Optional[str] = Field(None, max_length=60)
    temporary_password: Optional[str] = None
    password_reset_at: Optional[datetime] = None
    registration_unit_id: int

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: int

    class Config:
        from_attributes = True

class BiometricBase(BaseModel):
    template: bytes # Prisma uses Bytes, so Python should handle bytes
    finger: FingerEnum
    registration_date: datetime = Field(default_factory=datetime.now)
    device: str = Field("R307", max_length=50)
    registration_unit_id: int

class BiometricCreate(BiometricBase):
    pass

class Biometric(BiometricBase):
    id: int

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    rm: str = Field(..., max_length=20)
    period: PeriodEnum
    course: Optional[str] = Field(None, max_length=50)
    class_name: Optional[str] = Field(None, alias="class", max_length=20) # Renamed to class_name to avoid conflict with python keyword
    responsible: Optional[str] = Field(None, max_length=100)
    status: StudentStatusEnum = StudentStatusEnum.active
    person_id: int

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int

    class Config:
        from_attributes = True
        populate_by_name = True # To handle alias

class EmployeeBase(BaseModel):
    registration_number: str = Field(..., max_length=20)
    admission_date: Optional[date] = None
    active: bool = True
    person_id: int
    role_id: int

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    teacher_id: str = Field(..., max_length=20)
    subject: Optional[str] = Field(None, max_length=50)
    class_room: Optional[str] = Field(None, max_length=20)
    person_id: int

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int

    class Config:
        from_attributes = True

class VisitorBase(BaseModel):
    company: Optional[str] = Field(None, max_length=100)
    visit_reason: Optional[str] = None
    registration_date: date = Field(default_factory=date.today)
    visit_expiry_date: Optional[date] = None
    person_id: int
    responsible_employee_id: Optional[int] = None

class VisitorCreate(VisitorBase):
    pass

class Visitor(VisitorBase):
    id: int

    class Config:
        from_attributes = True

class PeopleBiometricsBase(BaseModel):
    person_id: int
    biometric_id: int

class PeopleBiometricsCreate(PeopleBiometricsBase):
    pass

class PeopleBiometrics(PeopleBiometricsBase):
    class Config:
        from_attributes = True

class BiometricLogBase(BaseModel):
    access_time: datetime = Field(default_factory=datetime.now)
    event_type: EventTypeEnum = EventTypeEnum.entry
    biometric_device: str = Field("R307", max_length=50)
    is_authorized: bool = False
    person_id: Optional[int] = None
    unit_id: int

class BiometricLogCreate(BiometricLogBase):
    pass

class BiometricLog(BiometricLogBase):
    id: int

    class Config:
        from_attributes = True

class WebAccessLogBase(BaseModel):
    login_time: datetime = Field(default_factory=datetime.now)
    logout_time: Optional[datetime] = None
    session_duration_minutes: Optional[int] = None
    event_type: EventTypeEnum
    person_id: Optional[int] = None
    unit_id: int

class WebAccessLogCreate(WebAccessLogBase):
    pass

class WebAccessLog(WebAccessLogBase):
    id: int

    class Config:
        from_attributes = True

class TokenBase(BaseModel):
    token: str
    expiration: datetime
    used: bool = False
    person_id: int

class TokenCreate(TokenBase):
    pass

class Token(TokenBase):
    id: int

    class Config:
        from_attributes = True

class TokenBlacklistBase(BaseModel):
    token: str
    expiration: datetime
    added_at: datetime = Field(default_factory=datetime.now)

class TokenBlacklistCreate(TokenBlacklistBase):
    pass

class TokenBlacklist(TokenBlacklistBase):
    id: int

    class Config:
        from_attributes = True

