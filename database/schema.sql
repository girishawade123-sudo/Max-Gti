-- ============================================================
-- MAX GTI — Gym Management System
-- Relational schema for the six entities in the ER design.
-- MySQL 8 / MariaDB syntax.
-- ============================================================

CREATE DATABASE IF NOT EXISTS max_gti
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE max_gti;

-- 1. MEMBER -------------------------------------------------
CREATE TABLE MEMBER (
  Member_ID          INT AUTO_INCREMENT PRIMARY KEY,
  Name               VARCHAR(100) NOT NULL,
  Date_of_Birth      DATE,
  Gender             VARCHAR(10),
  Phone              VARCHAR(20)  NOT NULL,
  Email              VARCHAR(120) UNIQUE,
  Address            VARCHAR(255),
  Emergency_Contact  VARCHAR(20),
  Join_Date          DATE         NOT NULL,
  Status             VARCHAR(15)  NOT NULL DEFAULT 'Active'
                     CHECK (Status IN ('Active','Inactive','Suspended'))
);

-- 2. MEMBERSHIP ---------------------------------------------
-- One MEMBER can hold many MEMBERSHIP rows (renewal history).
CREATE TABLE MEMBERSHIP (
  Membership_ID    INT AUTO_INCREMENT PRIMARY KEY,
  Member_ID        INT NOT NULL,
  Membership_Type  VARCHAR(20) NOT NULL
                   CHECK (Membership_Type IN ('Monthly','Quarterly','Half-Yearly','Yearly')),
  Start_Date       DATE    NOT NULL,
  End_Date         DATE    NOT NULL,
  Price            DECIMAL(10,2) NOT NULL,
  Status           VARCHAR(15) NOT NULL DEFAULT 'Active'
                   CHECK (Status IN ('Active','Expired','Pending')),
  CONSTRAINT fk_membership_member FOREIGN KEY (Member_ID)
    REFERENCES MEMBER(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_membership_dates CHECK (End_Date >= Start_Date)
);

-- 3. PAYMENT ------------------------------------------------
-- Points at both the MEMBER who paid and the MEMBERSHIP it settles.
CREATE TABLE PAYMENT (
  Payment_ID      INT AUTO_INCREMENT PRIMARY KEY,
  Member_ID       INT NOT NULL,
  Membership_ID   INT NOT NULL,
  Amount          DECIMAL(10,2) NOT NULL,
  Payment_Date    DATE NOT NULL,
  Payment_Method  VARCHAR(20) NOT NULL
                  CHECK (Payment_Method IN ('Cash','UPI','Card','Bank Transfer')),
  Payment_Status  VARCHAR(15) NOT NULL DEFAULT 'Paid'
                  CHECK (Payment_Status IN ('Paid','Pending','Failed','Refunded')),
  Transaction_ID  VARCHAR(40) UNIQUE,
  CONSTRAINT fk_payment_member FOREIGN KEY (Member_ID)
    REFERENCES MEMBER(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payment_membership FOREIGN KEY (Membership_ID)
    REFERENCES MEMBERSHIP(Membership_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. ATTENDANCE ---------------------------------------------
CREATE TABLE ATTENDANCE (
  Attendance_ID  INT AUTO_INCREMENT PRIMARY KEY,
  Member_ID      INT  NOT NULL,
  Entry_Date     DATE NOT NULL,
  Entry_Time     TIME NOT NULL,
  Exit_Time      TIME NULL,              -- NULL = member is still on the floor
  CONSTRAINT fk_attendance_member FOREIGN KEY (Member_ID)
    REFERENCES MEMBER(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. TRAINER ------------------------------------------------
CREATE TABLE TRAINER (
  Trainer_ID      INT AUTO_INCREMENT PRIMARY KEY,
  Name            VARCHAR(100) NOT NULL,
  Phone           VARCHAR(20)  NOT NULL,
  Email           VARCHAR(120) UNIQUE,
  Specialization  VARCHAR(50),
  Salary          DECIMAL(10,2),
  Joining_Date    DATE NOT NULL,
  Status          VARCHAR(15) NOT NULL DEFAULT 'Active'
                  CHECK (Status IN ('Active','On Leave','Inactive'))
);

-- 6. TRAINING_ASSIGNMENT ------------------------------------
-- Bridge table resolving the M:N relationship between MEMBER and TRAINER.
CREATE TABLE TRAINING_ASSIGNMENT (
  Assignment_ID  INT AUTO_INCREMENT PRIMARY KEY,
  Member_ID      INT  NOT NULL,
  Trainer_ID     INT  NOT NULL,
  Start_Date     DATE NOT NULL,
  End_Date       DATE NOT NULL,
  CONSTRAINT fk_assignment_member FOREIGN KEY (Member_ID)
    REFERENCES MEMBER(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assignment_trainer FOREIGN KEY (Trainer_ID)
    REFERENCES TRAINER(Trainer_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_assignment_dates CHECK (End_Date >= Start_Date)
);

-- Indexes on the foreign keys used by the dashboard queries ---
CREATE INDEX idx_membership_member  ON MEMBERSHIP(Member_ID);
CREATE INDEX idx_payment_member     ON PAYMENT(Member_ID);
CREATE INDEX idx_payment_membership ON PAYMENT(Membership_ID);
CREATE INDEX idx_attendance_member  ON ATTENDANCE(Member_ID);
CREATE INDEX idx_attendance_date    ON ATTENDANCE(Entry_Date);
CREATE INDEX idx_assignment_member  ON TRAINING_ASSIGNMENT(Member_ID);
CREATE INDEX idx_assignment_trainer ON TRAINING_ASSIGNMENT(Trainer_ID);

-- ============================================================
-- The dashboard figures in the UI are derived, not stored.
-- These are the equivalent SQL queries.
-- ============================================================

-- Total / active members
-- SELECT COUNT(*) FROM MEMBER;
-- SELECT COUNT(*) FROM MEMBER WHERE Status = 'Active';

-- Active memberships
-- SELECT COUNT(*) FROM MEMBERSHIP WHERE Status = 'Active';

-- Today's attendance and who is still inside
-- SELECT COUNT(*) FROM ATTENDANCE WHERE Entry_Date = CURDATE();
-- SELECT COUNT(*) FROM ATTENDANCE WHERE Entry_Date = CURDATE() AND Exit_Time IS NULL;

-- Revenue for the current month
-- SELECT SUM(Amount) FROM PAYMENT
--  WHERE Payment_Status = 'Paid'
--    AND YEAR(Payment_Date) = YEAR(CURDATE())
--    AND MONTH(Payment_Date) = MONTH(CURDATE());

-- Membership mix (donut chart)
-- SELECT Membership_Type, COUNT(*) FROM MEMBERSHIP
--  WHERE Status = 'Active' GROUP BY Membership_Type;

-- Trainer workload (horizontal bars)
-- SELECT t.Trainer_ID, t.Name, COUNT(a.Assignment_ID) AS Members
--   FROM TRAINER t
--   LEFT JOIN TRAINING_ASSIGNMENT a
--     ON a.Trainer_ID = t.Trainer_ID AND a.End_Date >= CURDATE()
--  GROUP BY t.Trainer_ID, t.Name;

-- Most active members (reports page)
-- SELECT m.Member_ID, m.Name, COUNT(*) AS Visits
--   FROM ATTENDANCE a JOIN MEMBER m ON m.Member_ID = a.Member_ID
--  GROUP BY m.Member_ID, m.Name ORDER BY Visits DESC LIMIT 10;

-- Members and the trainers they train with (the M:N join)
-- SELECT m.Name AS Member, t.Name AS Trainer, a.Start_Date, a.End_Date
--   FROM MEMBER m
--   JOIN TRAINING_ASSIGNMENT a ON a.Member_ID  = m.Member_ID
--   JOIN TRAINER t             ON t.Trainer_ID = a.Trainer_ID;

-- ============================================================
-- Extension: slot booking and the equipment asset log
-- Added after the original six-entity design.
-- ============================================================

-- 7. SLOT ---------------------------------------------------
-- Hourly booking windows the front desk maintains by hand.
CREATE TABLE SLOT (
  Slot_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Start_Time  TIME NOT NULL,
  End_Time    TIME NOT NULL,
  Capacity    INT  NOT NULL,
  Status      VARCHAR(10) NOT NULL DEFAULT 'Open'
              CHECK (Status IN ('Open','Closed')),
  CONSTRAINT chk_slot_times CHECK (End_Time > Start_Time),
  CONSTRAINT chk_slot_capacity CHECK (Capacity > 0),
  CONSTRAINT uq_slot_window UNIQUE (Start_Time, End_Time)
);

-- 8. BOOKING ------------------------------------------------
-- Bridge table: a member reserves one slot for one date.
-- Resolves the M:N relationship between MEMBER and SLOT.
CREATE TABLE BOOKING (
  Booking_ID    INT AUTO_INCREMENT PRIMARY KEY,
  Member_ID     INT  NOT NULL,
  Slot_ID       INT  NOT NULL,
  Booking_Date  DATE NOT NULL,
  Status        VARCHAR(12) NOT NULL DEFAULT 'Booked'
                CHECK (Status IN ('Booked','Attended','No-show','Cancelled')),
  CONSTRAINT fk_booking_member FOREIGN KEY (Member_ID)
    REFERENCES MEMBER(Member_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_booking_slot FOREIGN KEY (Slot_ID)
    REFERENCES SLOT(Slot_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  -- one member cannot hold two seats on the same day
  CONSTRAINT uq_booking_member_day UNIQUE (Member_ID, Booking_Date)
);

-- 9. EQUIPMENT ----------------------------------------------
-- Standalone asset log. No foreign keys — it references nothing.
CREATE TABLE EQUIPMENT (
  Equipment_ID       INT AUTO_INCREMENT PRIMARY KEY,
  Name               VARCHAR(100) NOT NULL,
  Category           VARCHAR(30)
                     CHECK (Category IN ('Cardio','Strength','Free Weights','Functional','Recovery')),
  Quantity           INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
  Purchase_Date      DATE,
  Last_Service_Date  DATE,
  Maintenance_Cost   DECIMAL(10,2) NOT NULL DEFAULT 0,   -- per unit, per year
  Status             VARCHAR(15) NOT NULL DEFAULT 'Working'
                     CHECK (Status IN ('Working','Needs service','Out of order'))
);

CREATE INDEX idx_booking_member ON BOOKING(Member_ID);
CREATE INDEX idx_booking_slot   ON BOOKING(Slot_ID);
CREATE INDEX idx_booking_date   ON BOOKING(Booking_Date);
CREATE INDEX idx_equipment_cat  ON EQUIPMENT(Category);

-- ---- Queries behind the Slots and Equipment pages ----

-- Seats left in each slot on a given date
-- SELECT s.Slot_ID, s.Start_Time, s.End_Time, s.Capacity,
--        s.Capacity - COUNT(b.Booking_ID) AS Seats_Left
--   FROM SLOT s
--   LEFT JOIN BOOKING b
--     ON b.Slot_ID = s.Slot_ID AND b.Booking_Date = CURDATE() AND b.Status <> 'Cancelled'
--  WHERE s.Status = 'Open'
--  GROUP BY s.Slot_ID, s.Start_Time, s.End_Time, s.Capacity;

-- How many members were actually inside during each slot window
-- SELECT s.Slot_ID, s.Start_Time, COUNT(a.Attendance_ID) AS Present
--   FROM SLOT s
--   LEFT JOIN ATTENDANCE a
--     ON a.Entry_Date = CURDATE()
--    AND a.Entry_Time >= s.Start_Time AND a.Entry_Time < s.End_Time
--  GROUP BY s.Slot_ID, s.Start_Time ORDER BY s.Start_Time;

-- No-show rate across all past bookings
-- SELECT ROUND(100 * SUM(Status = 'No-show') / NULLIF(SUM(Status IN ('Attended','No-show')), 0), 1) AS No_Show_Pct
--   FROM BOOKING;

-- Annual maintenance spend by category
-- SELECT Category, SUM(Maintenance_Cost * Quantity) AS Annual_Cost
--   FROM EQUIPMENT GROUP BY Category ORDER BY Annual_Cost DESC;

-- Equipment overdue for service (more than 90 days) or faulty
-- SELECT Equipment_ID, Name, Status, Last_Service_Date,
--        DATEDIFF(CURDATE(), Last_Service_Date) AS Days_Since_Service
--   FROM EQUIPMENT
--  WHERE Status <> 'Working' OR DATEDIFF(CURDATE(), Last_Service_Date) > 90
--  ORDER BY Days_Since_Service DESC;
