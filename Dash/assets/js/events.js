document.getElementById("upload-csv").addEventListener("change", function () {
  var myModal = bootstrap.Modal.getInstance(
    document.getElementById("centermodal")
  );
  if (myModal) {
    myModal.hide();
  }
  var backdrops = document.getElementsByClassName("modal-backdrop");
  for (let i = 0; i < backdrops.length; i++) {
    backdrops[i].parentNode.removeChild(backdrops[i]);
  }
});
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("showModalAfterReload")) {
    var myModal = new bootstrap.Modal(document.getElementById("centermodal"));
    myModal.show();

    localStorage.removeItem("showModalAfterReload");
  }
});
