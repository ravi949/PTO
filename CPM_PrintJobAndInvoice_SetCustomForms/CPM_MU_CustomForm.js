/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Jul 2016     Amzur Technologies, Inc.
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function mu_setCustomForm(recType, recId) {
	if (recType != 'invoice' && recType != 'opportunity') return;
	var cxt = nlapiGetContext();
	var customFormID = cxt.getSetting('SCRIPT', 'custscript_mu_customform');
	try{
		var rec = nlapiLoadRecord(recType, recId);
		rec.setFieldValue('customform', customFormID);
		nlapiSubmitRecord(rec, false, true);
	} catch(ex){
		nlapiLogExecution('ERROR', ex.name, ex.message);
	}
}
