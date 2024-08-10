all_campus = [{ "Datacenter Code": "SN/Leased" }, { "Datacenter Code": "SAT" }];
const headers = [
  "Date",
  "Campus",
  "DCTM",
  "Issues/changes Encountered",
  "Project Details",
  "Late Arrivals",
  "PTO",
  "Call Outs",
  "Techs WFH",
  "Techs on site",
  "Overtime Tech #",
  "Techs on BF",
  "Techs on DPLY/Other",
  "# Escorts",
  "Tickets Closed",
];
let selectedManager = null;

let global_ot_techs = {
  "A-Side Days": [],
  "A-Side Nights": [],
  "B-Side Days": [],
  "B-Side Nights": [],
};
let global_tech_count = 0;
let ot_techs = [];
let analyzed_tasks = [];
let previousSelectedManager = null;

let dcSites = [
  { "Datacenter Code": "DC1" },
  { "Datacenter Code": "DC2" },
  { "Datacenter Code": "DC3" },
  { "Datacenter Code": "DC4" },
  { "Datacenter Code": "DC5" },
  { "Datacenter Code": "DC6" },
  { "Datacenter Code": "DC7" },
  { "Datacenter Code": "DC8" },
];
let people = [];
let tasks = [];
let arr = [];
let SN1TextResults = "";
let arr0 = [];
let tasksByManager = {};
const snCampus = [];
const satCampus = [];
let saMetro = [];
let metro = [];
let shift = [];
let employees = [];
let allAssignedTasks = {};
let resolvedTasksToday = {};
let inProgressOrHoldTasksToday = {};
let btn_upload = document.getElementById("upload-csv");
let manager_timeline = [];
let date_timeline = [];
let timelineData = [];
let managers = [];
let DC_TX_Region1 = [];
let DC_TX_Region2 = [];
