import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { j } from "./firebase-config.js";

export const app = initializeApp(j);
export const database = getDatabase(app);
export const auth = getAuth(app);

let actionLog = [];

export function logAction(action, details) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${action}: ${details}`;
  actionLog.push(logEntry);
  console.log(logEntry);
}

export function exportLog() {
  const logText = actionLog.join("\n");
  const blob = new Blob([logText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `Logs_${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function addManager(newManager) {
  return get(ref(database, "managers")).then((snapshot) => {
    const nextIndex = snapshot.exists()
      ? Object.keys(snapshot.val()).length
      : 0;
    return set(ref(database, `managers/${nextIndex}`), newManager)
      .then(() => {
        logAction(
          "Add Manager",
          `Added manager ${newManager.manager} at index ${nextIndex}`
        );
      })
      .catch((error) => {
        console.error("Error adding manager to Firebase:", error);
      });
  });
}

export function removeManager(managerName) {
  return findManagerIndex(managerName).then((index) => {
    if (index !== null) {
      return remove(ref(database, `managers/${index}`))
        .then(() => {
          logAction(
            "Remove Manager",
            `Removed manager ${managerName} at index ${index}`
          );
        })
        .catch((error) => {
          console.error("Error removing manager from Firebase:", error);
        });
    }
  });
}

export function addPerson(newPerson) {
  return get(ref(database, "people")).then((snapshot) => {
    const nextIndex = snapshot.exists()
      ? Object.keys(snapshot.val()).length
      : 0;
    return set(ref(database, `people/${nextIndex}`), newPerson)
      .then(() => {
        logAction(
          "Add Tech",
          `Added tech ${newPerson.name} at index ${nextIndex}`
        );
      })
      .catch((error) => {
        console.error("Error adding tech to Firebase:", error);
      });
  });
}

export function updatePerson(name, updatedData) {
  return get(ref(database, "people")).then((snapshot) => {
    const peopleData = snapshot.val();
    for (let key in peopleData) {
      if (peopleData[key].name === name) {
        return set(ref(database, `people/${key}`), {
          ...peopleData[key],
          ...updatedData,
        })
          .then(() => {
            logAction("Update Tech", `Updated tech ${name} at index ${key}`);
          })
          .catch((error) => {
            console.error("Error updating tech in Firebase:", error);
          });
      }
    }
  });
}

export function updatePersonByIndex(index, updatedData) {
  return get(ref(database, `people/${index}`)).then((snapshot) => {
    const personData = snapshot.val();
    if (personData) {
      return set(ref(database, `people/${index}`), {
        ...personData,
        ...updatedData,
      })
        .then(() => {
          logAction("Update Tech", `Updated tech at index ${index}`);
        })
        .catch((error) => {
          console.error("Error updating tech in Firebase:", error);
        });
    }
  });
}

export function removePerson(name) {
  return get(ref(database, "people")).then((snapshot) => {
    const peopleData = snapshot.val();
    for (let key in peopleData) {
      if (peopleData[key].name === name) {
        return remove(ref(database, `people/${key}`))
          .then(() => {
            logAction("Remove Tech", `Removed tech ${name} at index ${key}`);
            reindexPeopleData();
          })
          .catch((error) => {
            console.error("Error removing tech from Firebase:", error);
          });
      }
    }
  });
}

export function reindexPeopleData() {
  return get(ref(database, "people")).then((snapshot) => {
    const peopleData = snapshot.val();
    const updatedPeople = {};
    let index = 0;

    for (let key in peopleData) {
      if (peopleData[key]) {
        updatedPeople[index] = peopleData[key];
        index++;
      }
    }

    return set(ref(database, "people"), updatedPeople)
      .then(() => {
        logAction("Reindex People", "Reindexed people data successfully.");
      })
      .catch((error) => {
        console.error("Error reindexing people data:", error);
      });
  });
}

export function getManagerShift(managerName) {
  return get(ref(database, "managers")).then((snapshot) => {
    const managersData = snapshot.val();
    for (let key in managersData) {
      if (managersData[key].manager === managerName) {
        return managersData[key].shift;
      }
    }
    return "";
  });
}

export function findManagerIndex(managerName) {
  return get(ref(database, "managers")).then((snapshot) => {
    const managersData = snapshot.val();
    for (let key in managersData) {
      if (managersData[key].manager === managerName) {
        return key;
      }
    }
    return null;
  });
}

export function populateTechSelect(selectId, manager) {
  get(ref(database, "people")).then((snapshot) => {
    const peopleData = snapshot.val();
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Tech</option>';
    for (let key in peopleData) {
      if (peopleData[key].manager === manager) {
        const option = document.createElement("option");
        option.value = peopleData[key].name;
        option.innerText = peopleData[key].name;
        select.appendChild(option);
      }
    }
  });
}

export function getTechInfo(techName) {
  return get(ref(database, "people")).then((snapshot) => {
    const peopleData = snapshot.val();
    for (let key in peopleData) {
      if (peopleData[key].name === techName) {
        return peopleData[key];
      }
    }
    return {};
  });
}

export function refreshUI() {
  window.TaskProcessor.loadPeopleData().then(() => {
    populateManagerSelect(
      "leftManagerSelect",
      document.getElementById("rightManagerSelect").value
    );
    populateManagerSelect(
      "rightManagerSelect",
      document.getElementById("leftManagerSelect").value
    );
    updateManagerContainer(
      "leftManagerContainer",
      document.getElementById("leftManagerSelect").value
    );
    updateManagerContainer(
      "rightManagerContainer",
      document.getElementById("rightManagerSelect").value
    );
  });
}

export function createAndShowModal() {
  const modalContainer = document.getElementById("modalContainer");
  modalContainer.innerHTML = `
      <div class="modal fade" id="managerModal" tabindex="-1" aria-labelledby="managerModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="managerModalLabel">Manager and Tech Management</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col">
                  <select id="leftManagerSelect" class="form-select"></select>
                  <div id="leftManagerContainer" class="manager-container" data-manager="left"></div>
                </div>
                <div class="col">
                  <select id="rightManagerSelect" class="form-select"></select>
                  <div id="rightManagerContainer" class="manager-container" data-manager="right"></div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <div class="col">
                <button id="manageManagersBtn" class="btn btn-primary">Manage Managers</button>
              </div>
              <div class="col">
                <button id="manageTechsBtn" class="btn btn-success">Manage Techs</button>
                <buton id="exportLogBtn" class="btn btn-info">Logs</button>
              </div>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

  populateManagerSelect(
    "leftManagerSelect",
    document.getElementById("rightManagerSelect").value
  );
  populateManagerSelect(
    "rightManagerSelect",
    document.getElementById("leftManagerSelect").value
  );

  document
    .getElementById("leftManagerSelect")
    .addEventListener("change", function () {
      updateManagerContainer("leftManagerContainer", this.value);
      populateManagerSelect("rightManagerSelect", this.value);
    });

  document
    .getElementById("rightManagerSelect")
    .addEventListener("change", function () {
      updateManagerContainer("rightManagerContainer", this.value);
      populateManagerSelect("leftManagerSelect", this.value);
    });

  document.getElementById("manageManagersBtn").addEventListener("click", () => {
    createAndShowManagerModal();
  });

  document.getElementById("manageTechsBtn").addEventListener("click", () => {
    createAndShowTechModal();
  });

  const modal = new bootstrap.Modal(document.getElementById("managerModal"));
  modal.show();

  const drake = dragula(
    [
      document.getElementById("leftManagerContainer"),
      document.getElementById("rightManagerContainer"),
    ],
    {
      moves: function (el, source, handle, sibling) {
        return !el.classList.contains("non-draggable");
      },
      accepts: function (el, target, source, sibling) {
        return !sibling || !sibling.classList.contains("manager-title");
      },
    }
  );

  drake.on("drop", function (el, target, source, sibling) {
    const leftManagerSelect =
      document.getElementById("leftManagerSelect").value;
    const rightManagerSelect =
      document.getElementById("rightManagerSelect").value;

    console.log("Left Manager Select Value:", leftManagerSelect);
    console.log("Right Manager Select Value:", rightManagerSelect);

    const newManager =
      target.id === "leftManagerContainer"
        ? leftManagerSelect
        : rightManagerSelect;

    const techName = el.innerText.trim();
    const techIndex = el.dataset.index;

    console.log("Tech Name:", techName);
    console.log("Tech Index:", techIndex);
    console.log("New Manager (Selected):", newManager);

    if (!newManager) {
      console.error("New Manager is empty. Ensure that a manager is selected.");
      return;
    }

    if (newManager === el.dataset.manager) {
      console.log("Manager is the same, no update needed.");
      refreshUI();
      return;
    }

    getManagerShift(newManager)
      .then((shift) => {
        console.log("Retrieved Shift:", shift);

        if (!shift) {
          console.error(
            "Shift is empty or invalid. Ensure that the manager has an associated shift."
          );
          return;
        }

        const updatedData = {
          manager: newManager,
          shift: shift,
        };

        updatePersonByIndex(techIndex, updatedData)
          .then(() => {
            console.log("Updated Tech Data:", updatedData);
            refreshUI();
          })
          .catch((error) => {
            console.error(
              "Error updating tech with new manager and shift:",
              error
            );
          });
      })
      .catch((error) => {
        console.error("Error retrieving manager shift:", error);
      });
  });

  function createAndShowManagerModal() {
    const managerModalContainer = document.createElement("div");
    managerModalContainer.innerHTML = `
      <div class="modal fade" id="editManagerModal" tabindex="-1" aria-labelledby="editManagerModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editManagerModalLabel">Manage Managers</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="managerActionSelect" class="form-label">Action</label>
                <select class="form-select" id="managerActionSelect">
                  <option value="add">Add Manager</option>
                  <option value="edit">Edit Manager</option>
                  <option value="remove">Remove Manager</option>
                </select>
              </div>
              <div class="mb-3" id="managerNameContainer">
                <label for="managerNameInput" class="form-label">Manager Name</label>
                <input type="text" class="form-control" id="managerNameInput">
              </div>
              <div class="mb-3">
                <label for="shiftInput" class="form-label">Shift</label>
                <select class="form-select" id="shiftInput">
                  <option value="A-Side Days">A-Side Days</option>
                  <option value="A-Side Nights">A-Side Nights</option>
                  <option value="B-Side Days">B-Side Days</option>
                  <option value="B-Side Nights">B-Side Nights</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="saveManagerBtn">Save</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(managerModalContainer);

    document.getElementById("managerNameInput").required = true;
    document.getElementById("shiftInput").required = true;

    const managerModal = new bootstrap.Modal(
      document.getElementById("editManagerModal")
    );
    const managerActionSelect = document.getElementById("managerActionSelect");
    const managerNameContainer = document.getElementById(
      "managerNameContainer"
    );

    managerActionSelect.addEventListener("change", (e) => {
      const action = e.target.value;
      if (action === "add") {
        managerNameContainer.innerHTML = `
          <label for="managerNameInput" class="form-label">Manager Name</label>
          <input type="text" class="form-control" id="managerNameInput">
        `;
      } else {
        managerNameContainer.innerHTML = `
          <label for="managerNameInput" class="form-label">Manager Name</label>
          <select class="form-select" id="managerNameInput"></select>
        `;
        populateManagerSelect("managerNameInput");
        document
          .getElementById("managerNameInput")
          .addEventListener("change", () => {
            getManagerShift(
              document.getElementById("managerNameInput").value
            ).then((shift) => {
              document.getElementById("shiftInput").value = shift;
            });
          });
      }
    });

    document.getElementById("saveManagerBtn").addEventListener("click", () => {
      const managerName = document
        .getElementById("managerNameInput")
        .value.trim();
      const shift = document.getElementById("shiftInput").value.trim();
      const action = managerActionSelect.value;

      if (!managerName) {
        Swal.fire("Manager name is required.");
        return;
      }

      if (!shift) {
        Swal.fire("Shift is required.");
        return;
      }

      if (action === "add") {
        addManager({ manager: managerName, shift: shift }).then(() => {
          refreshUI();
        });
      } else if (action === "edit") {
        findManagerIndex(managerName).then((index) => {
          if (index !== null) {
            set(ref(database, `managers/${index}`), {
              manager: managerName,
              shift: shift,
            })
              .then(() => {
                logAction(
                  "Update Manager",
                  `Updated manager ${managerName} at index ${index}`
                );
                refreshUI();
              })
              .catch((error) => {
                console.error("Error updating manager in Firebase:", error);
              });
          }
        });
      } else if (action === "remove") {
        removeManager(managerName).then(() => {
          refreshUI();
        });
      }

      managerModal.hide();
    });

    managerModal.show();
  }

  function createAndShowTechModal() {
    const techModalContainer = document.createElement("div");
    techModalContainer.innerHTML = `
      <div class="modal fade" id="manageTechModal" tabindex="-1" aria-labelledby="manageTechModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="manageTechModalLabel">Manage Techs</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="techActionSelect" class="form-label">Action</label>
                <select class="form-select" id="techActionSelect">
                  <option value="add">Add Tech</option>
                  <option value="remove">Remove Tech</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="managerSelectInput" class="form-label">Manager</label>
                <select class="form-select" id="managerSelectInput"></select>
              </div>
              <div class="mb-3" id="techNameContainer">
                <label for="techNameInput" class="form-label">Tech Name</label>
                <input type="text" class="form-control" id="techNameInput">
              </div>
              <div class="mb-3">
                <label for="shiftInput" class="form-label">Shift</label>
                <input type="text" class="form-control" id="shiftInput" readonly>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="saveTechBtn">Save</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(techModalContainer);

    document.getElementById("techNameInput").required = true;
    document.getElementById("managerSelectInput").required = true;

    const techModal = new bootstrap.Modal(
      document.getElementById("manageTechModal")
    );
    const techActionSelect = document.getElementById("techActionSelect");
    const techNameContainer = document.getElementById("techNameContainer");

    populateManagerSelect("managerSelectInput");

    techActionSelect.addEventListener("change", (e) => {
      const action = e.target.value;
      const techNameInput = document.getElementById("techNameInput");

      if (action === "add") {
        techNameContainer.innerHTML = `
          <label for="techNameInput" class="form-label">Tech Name</label>
          <input type="text" class="form-control" id="techNameInput">
        `;
        document
          .getElementById("managerSelectInput")
          .addEventListener("change", () => {
            getManagerShift(
              document.getElementById("managerSelectInput").value
            ).then((shift) => {
              document.getElementById("shiftInput").value = shift;
            });
          });
      } else {
        techNameContainer.innerHTML = `
          <label for="techNameInput" class="form-label">Tech Name</label>
          <select class="form-select" id="techNameInput"></select>
        `;
        document
          .getElementById("managerSelectInput")
          .addEventListener("change", () => {
            populateTechSelect(
              "techNameInput",
              document.getElementById("managerSelectInput").value
            );
            document
              .getElementById("techNameInput")
              .addEventListener("change", () => {
                getTechInfo(
                  document.getElementById("techNameInput").value
                ).then((data) => {
                  document.getElementById("shiftInput").value = data.shift;
                });
              });
          });
      }
    });

    document.getElementById("saveTechBtn").addEventListener("click", () => {
      const techName = document.getElementById("techNameInput").value.trim();
      const manager = document
        .getElementById("managerSelectInput")
        .value.trim();
      const shift = document.getElementById("shiftInput").value.trim();
      const action = techActionSelect.value;

      if (!techName) {
        Swal.fire("Tech name is required.");
        return;
      }

      if (!manager) {
        Swal.fire("Manager is required.");
        return;
      }

      if (!shift) {
        Swal.fire("Shift is required.");
        return;
      }

      if (action === "add") {
        addPerson({ name: techName, manager, shift }).then(() => {
          refreshUI();
        });
      } else if (action === "edit") {
        updatePerson(techName, { manager, shift }).then(() => {
          refreshUI();
        });
      } else if (action === "remove") {
        removePerson(techName).then(() => {
          refreshUI();
        });
      }

      techModal.hide();
    });

    techModal.show();
  }
  document.getElementById("exportLogBtn").addEventListener("click", exportLog);
}

function populateManagerSelect(selectId, otherSelectValue = "") {
  get(ref(database, "managers")).then((snapshot) => {
    const managersData = snapshot.val();
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select a manager</option>';
    for (let key in managersData) {
      if (managersData[key].manager !== otherSelectValue) {
        const option = document.createElement("option");
        option.value = managersData[key].manager;
        option.innerText = managersData[key].manager;
        select.appendChild(option);
      }
    }
  });
}

function updateManagerContainer(containerId, manager) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
    if (manager) {
      const managerTitle = document.createElement("h3");
      managerTitle.className = "manager-title non-draggable";
      managerTitle.innerText = manager;
      container.appendChild(managerTitle);

      get(ref(database, "people")).then((snapshot) => {
        const people = snapshot.val();
        for (let key in people) {
          if (people[key].manager === manager) {
            const techItem = document.createElement("div");
            techItem.className = "tech-item";
            techItem.innerText = people[key].name;
            techItem.dataset.manager = manager;
            techItem.dataset.index = key;
            container.appendChild(techItem);
          }
        }
      });

      container.dataset.manager = manager;
    }
  }
}
