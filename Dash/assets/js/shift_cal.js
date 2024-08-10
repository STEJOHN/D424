function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  let weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

function isOTCategory(person, workEndDate) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const taskDay = workEndDate.getDay();
  const taskDayName = daysOfWeek[taskDay];
  const taskHour = workEndDate.getHours();

  return (
    (person.shift === "A-Side Days" &&
      ["Thursday", "Friday", "Saturday"].includes(taskDayName)) ||
    (person.shift === "A-Side Nights" &&
      ["Thursday", "Friday", "Saturday"].includes(taskDayName) &&
      (taskDayName !== "Thursday" || taskHour >= 19)) ||
    (person.shift === "B-Side Days" &&
      ["Sunday", "Monday", "Tuesday"].includes(taskDayName)) ||
    (person.shift === "B-Side Nights" &&
      ["Sunday", "Monday", "Tuesday"].includes(taskDayName) &&
      (taskDayName !== "Sunday" || taskHour >= 19)) ||
    (person.shift === "Mon - Fri" &&
      person.manager === "Atma Upreti" &&
      ["Saturday", "Sunday"].includes(taskDayName))
  );
}
