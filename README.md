## What is this?

Modifies the Instacart orders page to make nicer-looking PDFs.

See the `example` directory for the difference.

## How to use?

1. Visit an orders page

	```
  	https://www.instacart.com/store/orders/<id>
	```

2. Run the bookmarklet

	```
	javascript:(function(){function proxyURL(u){return"https://x.avalanche.space/ic-proxy?url="+encodeURIComponent(u)}function doc(){return window.top.document}var frame_;function frameDoc(){if(!frame_){frame_=doc().createElement("iframe");frame_.style.display="none";doc().body.appendChild(frame_)}return frame_.contentDocument}const styleIDKey="id";var sheetMap={};var styleId_=-1;function nextStyleId(){styleId_++;return""+styleId_}function fixLinkElements(list){let promises=[];for(let i=0;i<list.length;i++){let sheet=list.item(i);if(sheet.ownerNode.tagName!="LINK"){continue}let p=makeFrameStyleElement(sheet);promises.push(p)}Promise.all(promises).then(()=>{rewriteLinkElements()}).catch(e=>{console.log(e)})}function rewriteLinkElements(){fixStyleElements(frameDoc().styleSheets,frameSheet=>{let id=frameSheet.ownerNode.dataset[styleIDKey];let linkSheet=sheetMap[id];if(!linkSheet){console.log("sheet not found in sheetMap for key=%s",id);return}linkSheet.disabled=true;let n=doc().createElement("style");n.textContent=serializeRules(frameSheet.cssRules);linkSheet.ownerNode.parentNode.insertBefore(n,linkSheet.ownerNode)})}function serializeRules(rules){let s="";for(let i=0;i<rules.length;i++){let r=rules.item(i);s+=r.cssText+"\n"}return s}function makeFrameStyleElement(sheet){return new Promise((resolve,reject)=>{fetch(proxyURL(sheet.href)).then(rsp=>{rsp.text().then(v=>{let id=nextStyleId();let style=frameDoc().createElement("style");style.textContent=v;style.dataset[styleIDKey]=id;frameDoc().head.appendChild(style);sheetMap[id]=sheet;resolve()})}).catch(e=>{reject(e)})})}function fixStyleElements(list,cb){for(let i=0;i<list.length;i++){let sheet=list.item(i);if(sheet.ownerNode.tagName!="STYLE"){continue}fixStyleSheet(sheet);if(cb){cb(sheet)}}}function fixStyleSheet(sheet){if(!sheet.cssRules){return}for(let j=0;j<sheet.cssRules.length;j++){let rule=sheet.cssRules.item(j);if(rule.type!=4){continue}let c=rule;c.conditionText=fixMedia(c.conditionText)}}const screenRx_=/(?:only\s+)?screen/g;const notAllRx_=/not\s+all/;function fixMedia(m){return m.split(",").map(s=>s.trim()).filter(s=>s.indexOf("print")==-1||s.indexOf("not")!=-1).filter(s=>!notAllRx_.test(s)).map(s=>s.replace(screenRx_,"all")).join(",")}function hideElement(...s){return s.some(sel=>{let e=doc().querySelector(sel);if(!e){return false}e.style.setProperty("display","none","important");return true})}function formatDate(date){const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];let day=date.getDay();let d=date.getDate();let m=date.getMonth();let y=date.getFullYear();return days[day]+", "+d+" "+months[m]+" "+y}function addDetails(now){let elem=doc().querySelector(".order-summary-header-text");if(!elem){return false}let loc=doc().location.href;let d=formatDate(now);let storeLink=doc().createElement("div");storeLink.textContent=loc;storeLink.style.fontSize="13px";storeLink.style.fontWeight="600";storeLink.style.color="rgb(67, 142, 173)";elem.appendChild(storeLink);let date=doc().createElement("div");date.textContent=d;date.style.fontSize="13px";date.style.fontWeight="600";elem.appendChild(date);return true}function orderID(){let idx=doc().location.pathname.lastIndexOf("/");if(idx==-1){return""}return doc().location.pathname.substring(idx+1)}function setTitle(){doc().title="instacart_order_"+orderID()}function main(){hideElement(".ic-nav-new","#header")||console.log("failed to find main header");hideElement(".order-status-header")||console.log("failed to find order status header");hideElement(".order-status-bulletin")||console.log("failed to find sidebar");hideElement(".order-status-recommendations-wrapper");hideElement(".order-summary-header-actions");hideElement("#toast-container");fixStyleElements(doc().styleSheets);fixLinkElements(doc().styleSheets);let now=new Date;addDetails(now)||console.log("failed to add details");setTitle()}main();})();
	```

3. Save the page as a PDF from your browser's print dialog


## Local development

1. Edit `proxyURL` in fix.ts to use a local development server
2. Start Google Chrome; if the local server doesn't use https, include
   the `--allow-running-insecure-content` flag
3. Run the proxy server

    ```
    go run proxy.go
    ```

4. Paste the script into the console


## I want to use my own proxy server

Edit `proxyURL` in fix.ts with the address of your server. Then run
`make bookmarklet` to re-generate the bookmarklet.
