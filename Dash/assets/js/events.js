document.getElementById("upload-csv").addEventListener("change", function () {
  // For Bootstrap 5
  var myModal = bootstrap.Modal.getInstance(
    document.getElementById("centermodal")
  );
  if (myModal) {
    myModal.hide();
  }
  // Remove the backdrop manually
  var backdrops = document.getElementsByClassName("modal-backdrop");
  for (let i = 0; i < backdrops.length; i++) {
    backdrops[i].parentNode.removeChild(backdrops[i]);
  }
});
document.addEventListener("DOMContentLoaded", function () {
  // Check if the modal should be shown after page load
  if (localStorage.getItem("showModalAfterReload")) {
    var myModal = new bootstrap.Modal(document.getElementById("centermodal"));
    myModal.show();

    // Clear the flag from local storage
    localStorage.removeItem("showModalAfterReload");
  }
});
