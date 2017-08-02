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
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
//=========================================
//SIGNNOW UPLOAD PDF BUTTON
//=========================================
function addButtonToRecord(type, form, request) {
	try{
		if (type == 'view' || type == 'edit') {
			var recordId = nlapiGetRecordId();
			if (recordId) {
				var rectype = nlapiGetRecordType();
				var docname = null;
				switch(rectype){
				case 'salesorder':docname = 'Sales Order';break;
				case 'estimate':docname = 'Quotation';break;
				case 'opportunity':docname = 'Print Job';break;
				}
				docname = docname+' '+nlapiGetFieldValue('tranid');
				form.setScript('customscript_cpm_signnow_clientmethods');
				form.addButton('custpage_button1', 'Send for Signature', "openIFrameModalSS("+recordId+",'"+docname+"')");
			} else {
				nlapiLogExecution('DEBUG', 'Error', 'Internaal id of the record is null');
			}
		}
	}catch(e){
		nlapiLogExecution('DEBUG','error in add button signnow cpm',e)
	}
}
