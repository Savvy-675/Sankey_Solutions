// Assignment 1: Data Structures 
// Problem Statement: Student Attendance Management System

import java.util.*;

public class attendanceManagement {
    Queue<Integer> Entry = new LinkedList<>();
    HashSet<Integer> presentStudent = new HashSet<>();
    Stack<Integer> Undo = new Stack<>();
    ArrayList<Integer> displayList = new ArrayList<>();

    // Storing student IDs sequencially classroom
    public void studentsEntry(int studentID) {
        if(presentStudent.contains(studentID)) {
            System.out.println("Student " + studentID + " is already present.");
        } else {
            Entry.add(studentID);
            presentStudent.add(studentID);
            Undo.push(studentID);
            displayList.add(studentID);
            System.out.println("Student " + studentID + " has entered.");
        }
    }

    // Checking if a student is present using their ID.
    public boolean isStudentPresent(int studentID) {
        if(presentStudent.contains(studentID)) {
            System.out.println("Student " + studentID + " is present.");
            return true;
        } else {
            System.out.println("Student " + studentID + " is not present.");
            return false;
        }
    } 
    
    //Allow the last marked attendance to be undone. 
    public void undoAttendance() {
        if(!Undo.isEmpty()) {
            int lastStudentID = Undo.pop();
            presentStudent.remove(lastStudentID);
            Entry.remove(lastStudentID);
            displayList.remove(Integer.valueOf(lastStudentID));
            System.out.println("Attendance for student " + lastStudentID + " has been undone.");
        } else {
            System.out.println("No attendance to undo.");
        }
    }

    // Display present students sequencially. 
    public void displayAttendance(){
        if(!displayList.isEmpty()) {
            System.out.println("Present students in order of arrival: " + displayList);
        } else {
            System.out.println("No students are currently present.");
        }
    }

    public static void main(String[]args){
        dataStructures attendanceSystem = new dataStructures();
        Scanner sc = new Scanner(System.in);
        int choice = 0;

        System.out.println("-Student Attendance Management System-");
        while(choice != 5) {
            System.out.println("1. Student Entry");
            System.out.println("2. Check Student Presence");
            System.out.println("3. Undo Last Attendance");
            System.out.println("4. Display Attendance");
            System.out.println("5. Exit");
            System.out.print("Enter your choice: ");
            choice = sc.nextInt();

            switch(choice) {
                case 1:
                    System.out.print("Enter Student ID to mark entry: ");
                    int StudentId = sc.nextInt();
                    attendanceSystem.studentsEntry(StudentId);
                    break;
                case 2:
                    System.out.print("Enter Student ID to check presence: ");
                    int id = sc.nextInt();
                    attendanceSystem.isStudentPresent(id);
                    break;
                case 3:
                    attendanceSystem.undoAttendance();
                    break;
                case 4:
                    attendanceSystem.displayAttendance();
                    break;
                case 5:
                    System.out.println("Exiting...");
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }
}
