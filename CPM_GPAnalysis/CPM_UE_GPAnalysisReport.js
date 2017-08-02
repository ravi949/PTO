/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Apr 2016     Amzur Technologies, Inc.
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function ue_printJobAddSuiteletTab(type, form, request){
	var cxt = nlapiGetContext();
	if (type != 'view' && cxt.getExecutionContext() != 'userinterface') return;
	if (searchInvoices(nlapiGetRecordId())){
		var btn = form.addButton('custpage_button_printjobprofit', 'Profit Report', 'getPrintJobProfitability();');
		form.setScript('customscript_cpm_client_gpanalysis');
	}
}

function searchInvoices(jobid){
	var filters = [], columns = [], results;
	filters.push(new nlobjSearchFilter('custcoljobnbr', null, 'is', jobid));
	filters.push(new nlobjSearchFilter('type', null, 'is', 'CustInvc'));
	filters.push(new nlobjSearchFilter('accounttype', null, 'anyof', 'Income'));
	columns.push(new nlobjSearchColumn('internalid'));
	results = nlapiSearchRecord('transaction', null, filters, columns);
	if (isArray(results) && results.length > 0) {
		return true;
	} else {
		return false;
	}
}