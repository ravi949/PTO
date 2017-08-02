/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Apr 2016     Amzur Technologies, Inc.
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function getPrintJobProfitability(type){
	var url = nlapiResolveURL('SUITELET', 'customscript_cpm_suitelet_gpanalysis', 'customdeploy_cpm_suitelet_gpanalysis');
	url += '&jobid=' + nlapiGetRecordId();
	window.open(url, 'Profitability Report');
}
