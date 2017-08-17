/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope TargetAccount
 * 
 */
define(['N/runtime',
		'N/record',
		'N/render',
		'N/search',
		'N/file'
	],

function(runtime, record, render, search, file) {
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
    			var scriptObj = runtime.getCurrentScript();
    			var templateFileId = scriptObj.getParameter({name: 'custscript_gpa_template_fileid'});
    			var incomeSearchId = scriptObj.getParameter({name: 'custscript_cpm_gpa_income_search'});
    			var cogsSearchId = scriptObj.getParameter({name: 'custscript_cpm_gpa_cogs_search'});
    			log.debug('Script Parameters', 'templateFileId: '+templateFileId+' and incomeSearchId: '+incomeSearchId+' and cogsSearchId: '+cogsSearchId);
    			
    			var jobId = context.request.parameters['jobid'];
    			log.debug('jobId', jobId);
    			
    			var jobRec = record.load({
    				type	: record.Type.OPPORTUNITY,
    				id		: jobId
    			});
    			
    			//Loading template file
    			var templateFile = file.load({
    			    id : templateFileId
    			});
    			
    			var renderer = render.create();
    			var xmlOutput = null;
    			
    			renderer.templateContent = templateFile.getContents();
    			renderer.addRecord({
    			    templateName : 'record',
    			    record		 : jobRec
    			});
    			
    			//attaching the converted custom data source income search results to renderer 
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'income',
    			    data: {type : 'income', list : getRenderDataFromSearch(incomeSearchId, jobId) }
    			});
    			
    			//attaching the converted custom data source cogs search results to renderer
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'cogs',
    			    data: {type : 'cogs', list : getRenderDataFromSearch(cogsSearchId, jobId)}
    			});
    				    
    			
    			xmlOutput = renderer.renderAsString();
    			
    			if (!(xmlOutput) || xmlOutput === null) throw {name: 'xmlOutput', message:'No output from template renderer.'};
    			
    			log.debug('Available Usage', runtime.getCurrentScript().getRemainingUsage());
    			
    			context.response.write(xmlOutput);
    		}catch(e){
    			log.debug(e.name, e.message);
    			log.debug('Available Usage:', runtime.getCurrentScript().getRemainingUsage());
    		}
    }
    
    /**
     * To fetch the results from search and convert that into the desired renderer custom data source
     * 
     * @param {string} searchID
     * @param {string} jobID
     * 
     * @return {Array} finalResults
     */
    function getRenderDataFromSearch(searchID, jobID){
    	try{
    		var finalResults = [];
    		
    		//loading the desired search
    		var searchObj = search.load({
    		    id: searchID
    		});
    		
    		//Adding additional filter i.e. jobID to filter out the results by PrintJob id
    		searchObj.filters.push(search.createFilter({
    		    name: 'custcoljobnbr',
    		    operator: search.Operator.ANYOF,
    		    values : jobID
    		}));
    		
    		var searchResults = searchObj.run().getRange({
    			start: 0,
    			end : 999
    		})
    		
    		//converting all search results into required renderer data source format
    		if(searchResults)
    		{
    			log.debug('searchResults.length',searchResults.length);			
    			for (var iTemp =0; iTemp < searchResults.length; iTemp++)
    			{
    		        var source = {};
    		        var loopsource = {};
    		        
    		        source.account = searchResults[iTemp].getText({ name: 'account', summary: search.Summary.GROUP });
    		        source.type = searchResults[iTemp].getText({ name: 'type', summary: search.Summary.GROUP });
    		        source.tranid = searchResults[iTemp].getValue({ name: 'tranid', summary: search.Summary.GROUP });
    		        source.trandate = searchResults[iTemp].getValue({ name: 'trandate', summary: search.Summary.MAX });
    		        source.mainname = searchResults[iTemp].getText({ name: 'mainname', summary: search.Summary.GROUP }); 
    		        source.memo = searchResults[iTemp].getValue({ name: 'memo', summary: search.Summary.GROUP });
    		        source.amount = (searchResults[iTemp].getValue({ name: 'amount', summary: search.Summary.SUM })).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    		        loopsource.values = source;
    		        finalResults.push(loopsource);
    			}
    		}
    		
    		return finalResults;
    	}catch(e){
    		log.debug(e.name, e.message);
    	}
    }
    
    return {
        onRequest: onRequestPrintGPAnalysis
    };
    
});
