/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope TargetAccount
 * 
 */
define(['N/runtime',
		'N/record',
		'N/render',
		'N/search'
	],

function(runtime, record, render, search) {
	/**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequestPrintGPAnalysis(context) {
    		try{
    			//Script Parameters
    			var templateFileId = runtime.getCurrentScript('SCRIPT', 'custscript_gpa_templatefileid');
    			var incomeSearchId = runtime.getCurrentScript('SCRIPT', 'custscript_cpm_gpa_incomesearch');
    			var cogsSearchId = runtime.getCurrentScript('SCRIPT', 'custscript_cpm_gpa_cogssearch');
    			
    			var currentUserId = runtime.getCurrentUser().id;
    			var jobId = context.request.parameters('jobid');
    			
    			var jobRec = record.load({
    				type	: record.Type.OPPORTUNITY,
    				id		: jobId
    			});
    			
    			var templateFile = file.load({
    			    id : templateFileId
    			});
    			
    			//var templateString = templateFile.getContents();
    			var renderer = render.create();
    			var xmlOutput = null;
    			
    			
    			
    			renderer.templateContent = templateFile.getContents();
    			renderer.addRecord({
    			    templateName : 'record',
    			    record		 : jobRec
    			});
    			
    			//Need to create the logic to combine 2 searches
    			var holderRecords = searchHolderRecords(currentUserId, jobId);
    			
    			renderer.addSearchResults({
    				templateName : 'custtrans', 
				    searchResult : holderRecords
    			});
    				    
    			
    			xmlOutput = renderer.renderAsString();
    			
    			if (!(xmlOutput) || xmlOutput === null) throw {name: 'xmlOutput', message:'No output from template renderer.'};
    			
    			log.debug('Available Usage', runtime.getCurrentScript().getRemainingUsage());
    			
    			context.response.write(xmlOutput);
    		}catch(e){
    			log.debug(e.name, e.message);
    			log.debug('Available Usage', runtime.getCurrentScript().getRemainingUsage());
    		}
    }
    

    return {
        onRequest: onRequestPrintGPAnalysis
    };
    
});