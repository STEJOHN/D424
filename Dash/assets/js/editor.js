$(document).ready(function () {
  $("#summernote").summernote({
    height: 500,
    minHeight: null,
    maxHeight: null,
    focus: false,
    tabDisable: false,
    toolbar: [
      ["style", ["bold", "italic", "underline", "clear"]],
      ["font", ["strikethrough", "superscript", "subscript"]],
      ["view", ["codeview"]],
      ["custom", ["copyButton", "teamsButton", "buttonExportExcel"]],
    ],
    popover: {
      link: [[["linkDialogShow", "unlink"]]],
    },
    buttons: {
      copyButton: function () {
        return $('<button type="button"/>')
          .html(
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>'
          )
          .addClass("note-btn btn btn-default btn-sm note-btn-copy")
          .attr("title", "Copy to clipboard")
          .on("click", function () {
            copyToClip($("#summernote").summernote("code"));
          });
      },
      buttonExportExcel: function () {
        return $('<button type="button" id="buttonExportExcel"/>')
          .html(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-xls" viewBox="0 0 16 16">
           <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM6.472 15.29a1.176 1.176 0 0 1-.111-.449h.765a.578.578 0 0 0 .254.384c.07.049.154.087.25.114.095.028.202.041.319.041.164 0 .302-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .085-.29.387.387 0 0 0-.153-.326c-.101-.08-.255-.144-.462-.193l-.619-.143a1.72 1.72 0 0 1-.539-.214 1.001 1.001 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.305 0 .564.05.78.152.216.102.383.239.5.41.12.17.186.359.2.566h-.75a.56.56 0 0 0-.12-.258.625.625 0 0 0-.247-.181.923.923 0 0 0-.369-.068c-.217 0-.388.05-.513.152a.472.472 0 0 0-.184.384c0 .121.048.22.143.3a.97.97 0 0 0 .405.175l.62.143c.217.05.406.12.566.211a1 1 0 0 1 .375.358c.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-2.945-3.358h-.893L1.81 13.37h-.036l-.832-1.438h-.93l1.227 1.983L0 15.931h.861l.853-1.415h.035l.85 1.415h.908L2.253 13.94l1.274-2.007Zm2.727 3.325H4.557v-3.325h-.79v4h2.487v-.675Z"/>
         </svg>`
          )
          .addClass("note-btn btn btn-default btn-sm note-btn-export")
          .attr("title", "Export to Excel")
          .on("click", function () {
            exportToExcel();
          });
      },
    },

    callbacks: {
      onPaste: function (e) {
        var clipboardData =
          e.originalEvent.clipboardData || window.clipboardData;
        var bufferText = clipboardData.getData("text/plain");
        var bufferHtml = clipboardData.getData("text/html") || bufferText;

        var div = document.createElement("div");
        div.innerHTML = bufferHtml;

        $(div)
          .find("*")
          .not("a, br")
          .removeAttr("style")
          .removeAttr("class")
          .removeAttr("id")
          .removeAttr("name");
        $(div)
          .find("body")
          .each(function () {
            $(this).replaceWith(this.childNodes);
          });

        $(div).html(function (index, html) {
          return html.replace(/\n/g, "<br>");
        });

        $(div)
          .find("a")
          .each(function () {
            $(this)
              .attr("href", $(this).attr("href"))
              .removeAttr("style class id name");
          });

        var cleanedData = div.innerHTML;

        e.preventDefault();
        document.execCommand("insertHTML", false, cleanedData);
      },
    },
  });
  $("#openEditorBtn").click(function () {
    $("#summernoteModal").modal("show");
  });
});

function copyToClip(str) {
  function listener(f) {
    f.clipboardData.setData("text/html", str);
    f.clipboardData.setData("text/plain", str);
    f.preventDefault();
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
}

function removeTags(str) {
  if (str === null || str === "") return false;
  else str = str.toString();

  str = str.replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/gi, "$1");

  str = str.replace(/<[^>]*>?/gm, "");

  return str;
}
