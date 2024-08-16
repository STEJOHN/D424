function createTaskModal(tasks_, taskId) {
  const task = tasks_.find((t) => t.Id === taskId);
  if (!task) {
    console.error("Task not found");
    return;
  }

  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = `
        <div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="taskModalLabel">Task Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modalContainer);

  function generateModalContent(task) {
    return `
            <div class="container">
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Title:</div>
                    <div class="col-md-8">${task.Title}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Assigned To:</div>
                    <div class="col-md-8">${task["Assigned To"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Created Date:</div>
                    <div class="col-md-8">${task["Created Date"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Datacenter Code:</div>
                    <div class="col-md-8">${task["Datacenter Code"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Expedite:</div>
                    <div class="col-md-8">${task.Expedite}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Fault Description:</div>
                    <div class="col-md-8">${task["Fault Description"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">State:</div>
                    <div class="col-md-8">${task.State}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Task Type:</div>
                    <div class="col-md-8">${task["Task Type"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Work Start Date:</div>
                    <div class="col-md-8">${task["Work Start Date"]}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">Work End Date:</div>
                    <div class="col-md-8">${task["Work End Date"]}</div>
                </div>
            </div>
        `;
  }

  function openTaskModal(task) {
    const modalBody = modalContainer.querySelector("#modalBody");
    modalBody.innerHTML = generateModalContent(task);
    const modal = new bootstrap.Modal(
      modalContainer.querySelector("#taskModal")
    );
    modal.show();
  }

  openTaskModal(task);
}
