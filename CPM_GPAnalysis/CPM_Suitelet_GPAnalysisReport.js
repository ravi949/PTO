/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Jun 2016     Amzur Technologies, Inc.
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function printGPAnalysis(request, response){
	try{
	var context = nlapiGetContext();
	var currentUserId = context.getUser();
	var templateFileId = context.getSetting('SCRIPT', 'custscript_gpa_templatefileid');
	var jobId = request.getParameter('jobid');
	var jobRec = nlapiLoadRecord('opportunity', jobId);
	var templateFile = nlapiLoadFile(templateFileId);
	var templateString = templateFile.getValue();
	var renderer = nlapiCreateTemplateRenderer();
	var incomeSearchId = context.getSetting('SCRIPT', 'custscript_cpm_gpa_incomesearch');
	var cogsSearchId = context.getSetting('SCRIPT', 'custscript_cpm_gpa_cogssearch');
	var xmlOutput = null;
	
	createHolderRecords('income', incomeSearchId, jobId);
	createHolderRecords('cogs', cogsSearchId, jobId);
	renderer.setTemplate(templateString);
	renderer.addRecord('record', jobRec);
	var holderRecords = searchHolderRecords(currentUserId, jobId);
	renderer.addSearchResults('custtrans', holderRecords);
	deleteHolderRecords(currentUserId, jobId);
	xmlOutput = renderer.renderToString();
	if (!(xmlOutput) || xmlOutput === null) throw {name: 'xmlOutput', message:'No output from template renderer.'};
	nlapiLogExecution('DEBUG', 'Available Usage', context.getRemainingUsage());
	response.write(xmlOutput);
	} catch (ex) {
		nlapiLogExecution('DEBUG', ex.name, ex.message);
		deleteHolderRecords(currentUserId, jobId);
		nlapiLogExecution('DEBUG', 'Available Usage', context.getRemainingUsage());
	}
}
/**
 * Creates records of custom record type - CPM GPAnalysis Summary Search Holder based on summary saved search results
 * 
 * @param {String} searchType Can be "income" or "cogs"
 * @param {String} searchid Internal ID of the saved search to run
 * @param {String} jobid Internal ID of the job / opportunity record
 * @returns {Void}
 * @throws ERR_CreateHolderRecords
 */
function createHolderRecords(searchType, searchid, jobid){
	try{
		if (searchType != 'income' && searchType != 'cogs') throw {name: 'Check Parameter', message: 'Invalid searchType ' + searchType};
		var rec = null, recFieldId = 'custrecord_cpm_gpa_ssh_';
		var jobfilter = new nlobjSearchFilter('custcoljobnbr', null, 'anyof', jobid);
		var search = nlapiLoadSearch(null, searchid);
		search.addFilter(jobfilter);
		var resultSet = search.runSearch();
		var result, rIndex = 0, rStep = 100;
		do{
			result = resultSet.getResults(rIndex, rStep);
			if (!(isArray(result))) throw {
				name: 'No results',
				message: 'Search ' + searchid + ' for job id ' + jobid + ' returns no results.'
			};
			for (var i = 0; i < result.length; i++){
				rec = nlapiCreateRecord('customrecord_cpm_gpa_summarysearchholder');
				rec.setFieldValue(recFieldId + 'jobid', jobid);
				rec.setFieldValue(recFieldId + 'rectype', searchType);
				rec.setFieldValue(recFieldId + 'account', result[i].getText('account', null, 'GROUP'));
				rec.setFieldValue(recFieldId + 'type', result[i].getText('type', null, 'GROUP'));
				rec.setFieldValue(recFieldId + 'date', result[i].getValue('trandate', null, 'MAX'));
				rec.setFieldValue(recFieldId + 'docnum', result[i].getValue('tranid', null, 'GROUP'));
				rec.setFieldValue(recFieldId + 'mainname', result[i].getText('mainname', null, 'GROUP'));
				rec.setFieldValue(recFieldId + 'memo', result[i].getValue('memo', null, 'GROUP'));
				rec.setFieldValue(recFieldId + 'amount', result[i].getValue('amount', null, 'SUM'));
				nlapiSubmitRecord(rec, false, true);
				rec = null;
			}
			rIndex += rStep;
		} while (result.length == rStep);
	} catch (ex) {
		throw {
			name: 'ERR_CreateHolderRecords',
			message: 'Error: ' + ex.name + '; Message: ' + ex.message
		};
	}
}
/**
 * Returns search results for specified searchType and jobid filters from custom records - CPM GPAnalysis Summary Search Holder
 * 
 * @param {String} currentUserId [required] Can be "income" or "cogs"
 * @param {String} jobid [required] Internal ID of the job / opportunity record
 * @returns {nlobjSearchResult}
 * @throws ERR_SearchHolderRecords
 */
function searchHolderRecords(currentUserId, jobId) {
	try{
		var filters = [], columns = [], recFieldId = 'custrecord_cpm_gpa_ssh_', record = 'customrecord_cpm_gpa_summarysearchholder', results;
		// Set search filters
		filters.push(new nlobjSearchFilter(recFieldId + 'jobid', null, 'is', jobId));
		filters.push(new nlobjSearchFilter('owner', null, 'anyof', currentUserId));
		// Set search result columns
		columns.push(new nlobjSearchColumn(recFieldId + 'rectype'));
		columns.push(new nlobjSearchColumn(recFieldId + 'account'));
		columns.push(new nlobjSearchColumn(recFieldId + 'type'));
		columns.push(new nlobjSearchColumn(recFieldId + 'docnum'));
		columns.push(new nlobjSearchColumn(recFieldId + 'date'));
		columns.push(new nlobjSearchColumn(recFieldId + 'mainname'));
		columns.push(new nlobjSearchColumn(recFieldId + 'memo'));
		columns.push(new nlobjSearchColumn(recFieldId + 'amount'));
		//run search
		results = nlapiSearchRecord(record, null, filters, columns);
	if (!(isArray(results))) throw {
		name: 'No results',
		message: 'No holder records for job id ' + jobId
	};
	return results;
	} catch(ex) {
		throw {
			name: 'ERR_SearchHolderRecords',
			message: 'Error: ' + ex.name + '; Message: ' + ex.message
		};
	}
}
/**
 * Deletes all custom records of type - CPM GPAnalysis Summary Search Holder that match the Job ID
 * 
 * @param {String} jobid Internal ID of the job / opportunity record
 * @returns {Void}
 * @throws ERR_DeleteHolderRecords
 */
function deleteHolderRecords(currentUserId, jobId) {
	var recFieldId = 'custrecord_cpm_gpa_ssh_', record = 'customrecord_cpm_gpa_summarysearchholder', results, filters = [];
	filters.push(new nlobjSearchFilter(recFieldId + 'jobid', null, 'is', jobId));
	filters.push(new nlobjSearchFilter('owner', null, 'anyof', currentUserId));
	results = nlapiSearchRecord(record, null, filters);
	if (isArray(results)) {
		try{
			for (var i = 0; i < results.length; i++){
				nlapiDeleteRecord(record, results[i].getId());
			}
		} catch(ex) {
			throw {name: 'ERR_DeleteHolderRecords', message: ex.name + '; ' + ex.message};
		}
	}
}
