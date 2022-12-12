import mysql from "mysql2";
import cTable from "console.table";
import inquirer from "inquirer";
import dotenv from 'dotenv';
dotenv.config();

// Connect to database
const db = mysql.createConnection(
  {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  },
  console.log(`Connected to the employees_db database.`)
);

db.connect((err) => {
  if (err) throw err;
  console.log("MySql Connected!!!");

  promptInit();
});

function promptInit() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "request",
        message: "Please select the following option",
        choices: [
          "View all departments",
          "View all role",
          "View all employees",
          "Add a department",
          "Add a role",
          "Add an employee",
          "Update an employee role",
          "Exit",
        ],
      },
    ])
    .then(function (res) {
      switch (res.request) {
        case "View all departments":
          viewDepartments();
          break;
        case "View all role":
          viewRoles();
          break;
        case "View all employees":
          viewEmployees();
          break;
        case "Add a department":
          addDepartment();
          break;
        case "Add a role":
          addRole();
          break;
        case "Add an employee":
          addEmployee();
          break;
        case "Update an employee role":
          updateEmployee();
          break;
        default:
          exit();
      }
    });
}

function viewDepartments() {
  db.query("SELECT * FROM department", function (err, results) {
    if (err) throw err;
    console.table(results);
    promptInit();
  });
}

function viewRoles() {
  db.query(
    `SELECT role.id, role.title, role.salary, department.name AS Department 
    FROM role 
    LEFT JOIN department ON role.department_id = department.id;`,
    function (err, results) {
      if (err) throw err;
      console.table(results);
      promptInit();
    }
  );
}

function viewEmployees() {
  db.query(
    `SELECT 
    employee.id, 
    employee.first_name AS First_Name, 
    employee.last_name AS Last_Name,
    role.title AS Title,
      department.name AS Department,
      role.salary AS salary,
      CONCAT(manager.first_name, ' ', manager.last_name) AS Manager
  FROM employee
  LEFT JOIN role ON employee.role_id = role.id
  LEFT JOIN department on role.department_id = department.id
  LEFT JOIN employee manager on manager.id = employee.manager_id`,
    function (err, results) {
      if (err) throw err;
      console.table(results);
      promptInit();
    }
  );
}

function addDepartment() {
  inquirer
    .prompt([
      {
        name: "department",
        type: "input",
        message: "Please enter the new department name.",
      },
    ])
    .then(function (answer) {
      db.query(
        `INSERT INTO department(name) VALUES (?);`, // role: INSERT INTO role(tile,salry, depart_id) VALUES (?, ?, ?)
        [answer.department], // role [1,2,3]
        function (err) {
          if (err) throw err;
          console.log("Departments updated with " + answer.department);
          promptInit();
        }
      );
    });
}

function addRole() {
  inquirer
    .prompt([
      {
        name: "role",
        type: "input",
        message: "Enter a role title:",
      },
      {
        name: "department_id",
        type: "number",
        message: "Enter department id",
        validate: function (value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
      {
        name: "salary",
        type: "number",
        message: "Enter the role salary",
        validate: function (value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
    ])
    .then(function (answer) {
      db.query(
        "INSERT INTO role (title, department_id, salary) VALUES (?, ?, ?)",
        [answer.role, answer.department_id, answer.salary],
        function (err) {
          if (err) throw err;
          console.log("Emoloyee Roles added " + answer.role);
          promptInit();
        }
      );
    });
}

function addEmployee() {
  inquirer
    .prompt([
      {
        name: "first_name",
        type: "input",
        message: "What is the first name?",
      },
      {
        name: "last_name",
        type: "input",
        message: "What is the last name?",
      },
      {
        name: "role_id",
        type: "number",
        message: "What is the role id?",
        validate: function (value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
      {
        name: "manager_id",
        type: "number",
        message: "What is the manager id?",
        validate: function (value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
    ])
    .then(function (answer) {
      db.query(
        "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
        [answer.first_name, answer.last_name, answer.role_id, answer.manager_id],
        function (err) {
          if (err) throw err;
          console.log("New emoloyee added " + answer.employee);
          promptInit();
        }
      );
    });
}

function updateEmployee() {
  db.query("SELECT * FROM employee",
    function (err, results) {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: "choice",
            type: "rawlist",
            choices: function () {
              let choiceArr = [];
              for (i = 0; i < results.length; i++) {
                choiceArr.push(results[i].last_name);
              }
              return choiceArr;
            },
            message: "Select employee to update"
          }
        ])
        .then(function (answer) {
          const useName = answer.choice;

          db.query("SELECT * FROM employee",
            function (err, results) {
              if (err) throw err;
              inquirer
                .prompt([
                  {
                    name: "role",
                    type: "rawlist",
                    choices: function () {
                      let choiceArr = [];
                      for (i = 0; i < results.length; i++) {
                        choiceArr.push(results[i].role_id)
                      }
                      return choiceArr;
                    },
                    message: "Select the role title"
                  },
                  {
                    name: "manager",
                    type: "number",
                    validate: function (value) {
                      if (isNaN(value) === false) {
                        return true;
                      }
                      return false;
                    },
                    message: "Enter the manager ID",
                    default: "1"
                  }
                ]).then(function (answer) {
                  console.log(answer);
                  console.log(useName);
                  db.query("UPDATE employee SET ? WHERE last_name = ?",
                    [
                      {
                        role_id: answer.role,
                        manager_id: answer.manager
                      }, useName
                    ],
                  ),
                    console.log("Emoloyee now updated");
                  promptInit();
                })
            })
        })
    })
}

function exit() {
  console.log("Program completed");
}

