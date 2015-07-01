# Authenticated File Download in JavaScript

## User Story

I want to be able to download the PDF [rendition](https://doc.nuxeo.com/x/Mo5kAQ) of a Nuxeo document via [CMIS](https://doc.nuxeo.com/x/JIAO) using a single-page Web application. To be clear the Web application is not a Nuxeo application, just a basic app running on Apache, for example.  The request involves a simple URL like this:

    http://localhost:8080/nuxeo/json/cmis/default/root?succinct=true&streamId=nuxeo%3Arendition%3Apdf&cmisselector=content&objectId=07cdb579-b845-46a7-b22f-f49fa4f7de8b&download=attachment

## Usage

You need to [configure CORS in Nuxeo](https://doc.nuxeo.com/x/vIvZ) to allow CMIS requests from a Web app. I chose to restrict it to just the JSON binding from localhost.  Here is my contribution:

    <extension target="org.nuxeo.ecm.platform.web.common.requestcontroller.service.RequestControllerService" point="corsConfig">
        <corsConfig name="forCMISBrowserBinding" allowOrigin="http://localhost">
            <pattern>/nuxeo/json/cmis.*</pattern>
        </corsConfig>
    </extension>

You'll need some sort of Web server to host the application. I used Apache.

* Open `authenticated-file-download.html`.
* Fill in the parameters as needed.
* **The document ID is required.** There's one hard-coded in the JS but that's from my local server.
* Click the `Download` button.

## The Problem

### Authentication

Of course the request must be authenticated.  In general I want to avoid use of the browser's ugly authentication dialog, so this means the authentication needs to occur in code.  Thus a simple `<a>` tag will not suffice.  If the user clicks a link this navigates away from my single-page application, thus I lose any authentication info and the user gets the authentication dialog. The same problem applies to techniques that involve `window.open`, using a `<form>`, using an `<iframe>`, etc.

### Save the file locally

In addition I want the user experience to be just like any other file download. Maybe it goes to the "Downloads" folder or even opens in the browser depending on the file type and browser support.

## The Solution

The solution is made of two parts:

* An [XMLHTTPRequest](https://xhr.spec.whatwg.org/) (XHR) call to retrieve the file (as a blob); the call is authenticated.
* A Javascript library that takes the blob returned by XHR and saves it on the local system as a file.

## The Explanation

To get the blob you just need to authenticate via XHR. The built-in params (`username` and `password`) for XHR don't seem to work (in fact they may not be intended to be used in this way). However manually adding the `Authorization` header DOES work.  E.g.:

       xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(userName + ":" + password));

To save the blob I used [https://github.com/eligrey/FileSaver.js/](https://github.com/eligrey/FileSaver.js/). As far as I can decipher, here is what it does:

* Save the blob to temporary storage using the [Javascript `File` API](http://www.w3.org/TR/file-upload/).
* Create an `<a>` element and assign a [blob URL](http://www.w3.org/TR/FileAPI/#DefinitionOfScheme) to it that references the above file.
* Enable the HTML5 [`download` attribute](http://www.w3.org/TR/html5/links.html#downloading-resources) for this element.
    * This is how it works for Chrome and Firefox, but it [depends on the browser](http://caniuse.com/#feat=download). For example Safari does not yet support `download`.  `FileSaver.js` is robust enough to support several browsers.
* "Click" the element via Javascript.

Note that `FileSaver.js` implements the HTML5 W3C `saveAs()` interface.

## The Context

The solution is deceptively simple. It took me several days of research, understanding, and testing to find the answer. While scouring the internet I found there are several ways to "download a file" using Javascript and several ways to make authenticated requests using Javascript but I found literally nothing that combines the two on the client side.  Every solution I found that attempted to combine the two involved modifications on the server side.

Caveat: the solution, in particular the file download, relies on the `File` API from HTML5, as well as the `download` attribute.  The point is it works well mainly in modern browsers.

## The Contents

* `authenticated-file-download.html` - Here you can enter the necessary info to build a test URL and download the rendition.
* `lib/authenticated-file-download.js` - The JS bits that make up the application.
* `lib/base64.js` - Used to encode the user name and password for the `Authorization` header. It supposedly originated [here](http://www.webtoolkit.info/javascript-base64.html) but that gives a `404`. I actually found it [here](http://stackoverflow.com/a/246813).
* `lib/FileSaver.js` - This library handles saving a file (e.g. the blob returned by XHR) to the local disk.  From [https://github.com/eligrey/FileSaver.js/](https://github.com/eligrey/FileSaver.js/).

## The Tips

* I tried to make this example as simple as possible to focus on a) authenticating the request and b) saving the file.  By no means is it meant to be a "best practice" example, just a simple explanation of how it works.

* You need to [configure CORS in Nuxeo](https://doc.nuxeo.com/x/vIvZ) to allow CMIS requests from a Web app. I chose to restrict it to just the JSON binding.  Here is my contribution:

***

    <extension target="org.nuxeo.ecm.platform.web.common.requestcontroller.service.RequestControllerService" point="corsConfig">
        <corsConfig name="forCMISBrowserBinding" allowOrigin="http://localhost">
            <pattern>/nuxeo/json/cmis.*</pattern>
        </corsConfig>
    </extension>

***

* [download.js](http://danml.com/download.html) appears to be an older (but viable) solution.  The reason I mention it is because it appears to skip the step of saving the file to local storage.  It takes the blob returned by XHR and creates an anchor tag that points to it directly in memory (still using the blob URL syntax).  But the behavior in Safari is far inferior to `FileSaver.js`.

* You can't access the filename using XHR once you're using CORS. There's a great explanation [here](http://stackoverflow.com/a/7463297). The summary is that you are limited to "simple response headers" when using XHR with CORS.  Nuxeo returns the file name in the `content-disposition` header; this one is not accessible.  It's no big deal when using CMIS because you can just get the document name via the CMIS object. 

* Incidentally XHR's [withCredentials does nothing](http://chrisroos.co.uk/blog/2013-03-08-the-behaviour-of-xmlhttprequest-withcredentials-when-used-with-cors) and appears to have nothing to do with the username/password passed to XHR. It's used for passing cookies with CORS requests.  CORS normally restricts/does not pass cookies across domains.