/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 May 2017     Tajuddin
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
//=========================================
//SIGNNOW PRINT TO PDF IFRAME MODAL
//=========================================
function openIFrameModalSS(recordId,docName){
	try{
		var url = "";
		window.closeModal = function(){
			jQuery('.iframe-modal-bg, .iframe-modal, .btn-close-model').remove();
		};

		var createPdfUrl = nlapiResolveURL('SUITELET', 'customscript_cpm_signnow_generatepdf', 'customdeploy_cpm_signnow_generatepdf', false);
		console.log(createPdfUrl)
		//url = 'https://integrations.cudasign.com/shared/#/redirect?redirect_uri=' + encodeURIComponent(window.location.origin + createPdfUrl + '&id=' + recordId);
		
		var modalHtml = '<div class="iframe-modal-bg" style="display:block; position:fixed; top:0; right:0; bottom:0; left:0; background:rgba(95, 95, 95, 0.5); z-index:1001;"></div>';
		modalHtml += '<button onclick="window.closeModal();" class="btn-close-model" style="display: block; position: absolute; z-index: 1003; top: 20px; right: 70px; width: 70px; height: 30px; color: #fff; background: #000; border: none; cursor:pointer;" >Close</button>';

		modalHtml += '<div class="iframe-modal" style="overflow:hidden; border-radius: 0.5rem; position:fixed; top:50px; right:50px; bottom:50px; left:50px; background:#fff; z-index:1002; box-shadow:#000 0px 0px 20px"><br><br><br><br><center>Give a Name for your Document<br><br><input type="text" name="text" value="'+docName+'" id="myText" onkeyup="stoppedTyping()" /> <br><br><button id="myBtn" class="btn-close-model" style="display: block; width: 100px; height: 40px; color: #fff; background: #000; border: none; cursor:pointer;"  onClick="getRecordName('+recordId+')">OK</button></center>';
		
		jQuery("body").append(modalHtml);
	}catch(e){
		console.log('exception in client script signnow cpm',e)
	}
}


//=========================================
//ADD A NAME TO THE DOCUMENT
//=========================================
function getRecordName(recordId) {
	try{
		var documentName= document.getElementById("myText").value,
		recordType = nlapiGetRecordType();
		if(documentName == '' || documentName=='undefined' || documentName == "null"){
			alert("Give a name to the document.");
			return;
		}else{
			documentName = documentName.replace(/ /g,'_');
			var createPdfUrl = nlapiResolveURL('SUITELET', 'customscript_cpm_signnow_generatepdf', 'customdeploy_cpm_signnow_generatepdf', false);
			console.log(createPdfUrl)
//			// var myUrl ='https://testsignnowapp.herokuapp.com/shared/#/redirect?redirect_uri=' + encodeURIComponent(window.location.origin+createPdfUrl + '&id=' + recordId + '&docName=' + documentName);
			var myUrl ='https://integrations.signnow.com/shared/#/redirect?redirect_uri=' + encodeURIComponent(window.location.origin+createPdfUrl + '&id=' + recordId + '&docName=' + documentName+'&type='+recordType);
			var modalHtml = '<div class="iframe-modal" style="overflow:hidden; border-radius: 0.5rem; position:fixed; top:50px; right:50px; bottom:50px; left:50px; background:#fff; z-index:1002; box-shadow:#000 0px 0px 20px"><iframe src="'+myUrl+'" frameborder="0" style="width:100%; height:100%; position:absolute; margin:0; padding:0;"></iframe></div>';
			jQuery("body").append(modalHtml);
		}
	}catch(e){
		console.log('exception in client script signnow cpm',e)
	}
}
