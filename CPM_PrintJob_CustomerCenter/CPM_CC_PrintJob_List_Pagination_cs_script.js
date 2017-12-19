/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url','N/format'],
/**
 * @param {url} redirect
 */
function(url,format) {
	
	function pageInit(scriptContext){
		/**If user clicks the Search button then append the search field values to the url and reloads the page and returns required results*/
		jQuery('#search_cpm_pj').on('click',function(){
			console.log(scriptContext.currentRecord.getValue('custpage_cpm_customer'))
			filterSearch(scriptContext)
		});		
		/**If user changes the pagination field then This event triggered and change the Print Job list*/
		jQuery('#custbody_pagination').on('change',function(){
			console.log(scriptContext.currentRecord.getValue('custbody_pagination'));
			filterSearch(scriptContext)
		});
	}
    
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	var rec = scriptContext.currentRecord;
    	var sDate = rec.getValue('custpage_cpm_startdate'),
    	eDate = rec.getValue('custpage_cpm_enddate');
    	/**Setting the End date as Start date */
    	if(scriptContext.fieldId=='custpage_cpm_startdate'){
    		rec.setValue({
        	    fieldId: 'custpage_cpm_enddate',
        	    value: sDate,
        	    ignoreFieldChange: true
        	});
    	}
    }

    //filter the search based on parameters
    function filterSearch(scriptContext){
		var rec = scriptContext.currentRecord,
    	fmtId = rec.getValue('custpage_cpm_format'),
    	title = rec.getText('custpage_cpm_titledescription'), 
    	sDate = rec.getValue('custpage_cpm_startdate'),
    	eDate = rec.getValue('custpage_cpm_enddate'),
    	searchIndex = rec.getValue('custbody_pagination'),
    	jbc = rec.getValue('custpage_cpm_jobcompleted'),
    	inflag = rec.getValue('custpage_cpm_internationalflag'),
    	billed = rec.getValue('custpage_cpm_billedflag'),
    	region = rec.getValue('custpage_cpm_region'),
    	stringUrl = '';
    	if(fmtId){
    		stringUrl += '&fid='+fmtId;
    		console.log('formate '+fmtId);
    	}
    	if(title !=' '){
    		stringUrl += '&tt='+title;
    		console.log('title '+title);
    	}
    	if(sDate){
    		var startDate = format.format({
    		    value: sDate,
    		    type: format.Type.DATE
    		    });
    		stringUrl += '&sd='+startDate;
    		console.log('Start Date '+startDate);
    	}
    	if(eDate){
    		var endDate = format.format({
    		    value: eDate,
    		    type: format.Type.DATE
    		    });
    		stringUrl += '&ed='+endDate;
    		console.log('End Date '+endDate);
    	}
    	if(jbc){
    		stringUrl += '&jbc='+jbc;
    	}
    	if(inflag){
    		stringUrl += '&inflag='+inflag;
    	}
    	if(billed){
    		stringUrl += '&billed='+billed;
    	}
    	if(region){
    		stringUrl += '&region='+region;
    	}
    	
    	if(searchIndex != ''){
    		stringUrl += '&indx='+searchIndex
    	}
    	
    	var output = url.resolveScript({
    	    scriptId: 'customscript_cpm_pj_listview_inhtml',
    	    deploymentId: 'customdeploy_cpm_pj_listview_inhtml',
    	    returnExternalUrl: false
    	});
//    	if(stringUrl)
    	window.location.href = output+stringUrl;
    }
    
    function downloadCSV(){
    	document.getElementsByTagName('form')[0].submit();
    }

    return {
    	pageInit:pageInit,
        fieldChanged: fieldChanged,
        downloadCSV:downloadCSV
    };
    
});
