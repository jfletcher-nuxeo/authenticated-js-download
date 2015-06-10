// I hard-coded a value here just to make testing simpler.
var docID = "07cdb579-b845-46a7-b22f-f49fa4f7de8b";
var nuxeoUrl;
var userName;
var password;


window.onload = main;

function main() {
   document.getElementById("fileDownloadLink").addEventListener("click", handleClick);
}


function handleClick(clickAction) {

   var enteredDocId = document.getElementById("docId").value;
   if (enteredDocId != null && enteredDocId != "") {
      docID = enteredDocId;
   }

   var fileDownloadURL = nuxeoUrl + "/json/cmis/default/root?succinct=true&streamId=nuxeo%3Arendition%3Apdf&cmisselector=content&objectId=" + docID + "&download=attachment";

   var xhr = new XMLHttpRequest();
   // open() accepts username and password parameters but it never seemed to work.
   xhr.open('GET', fileDownloadURL, true);
   // Manually set the authorization header, seems to work.
   xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(userName + ":" + password));
   xhr.responseType = 'blob';
   xhr.onload = function (e) {
      saveAs(xhr.response, "myFile.pdf");
   }
   xhr.send();
}