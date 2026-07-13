# Resident Status Transition Matrix

Allowed foundational transitions:

```text
pre_admission -> admission_scheduled -> active
pre_admission -> inactive

admission_scheduled -> active
admission_scheduled -> inactive/cancelled later

active/in_home -> active/temporarily_absent
active/in_home -> active/in_hospital
active/temporarily_absent -> active/in_home
active/in_hospital -> active/in_home

active -> discharged
active -> deceased

discharged -> active only through new readmission episode
deceased -> no standard transition
inactive -> reactivation only by authorised administrative process
```

Invalid combinations:

- discharged with active bed assignment
- deceased with active admission
- active/in_hospital without active hospital-transfer absence
- active resident with two active beds
- two active absences for one resident
- respite stored as an internal lifecycle state
