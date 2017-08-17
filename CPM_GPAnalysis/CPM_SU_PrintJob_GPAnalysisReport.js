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
    			
    			//===== Logic to combine both 'income' and 'cogs' searches and to pass the same to renderer object =====
    			//Fetching all results from income search
    			var incomeSearchObj = search.load({
    			    id: incomeSearchId
    			});
    			
    			incomeSearchObj.filters.push(search.createFilter({
    			    name: 'custcoljobnbr',
    			    operator: search.Operator.ANYOF,
    			    values : jobId
    			}));
    			
    			var incomeSearchResults = incomeSearchObj.run().getRange({
	    			start: 0,
	    			end : 999
	    		})

	    		//converting all income search results into required renderer data source
	    		var incomeResults = [];

    			if(incomeSearchResults)
    			{
    				log.debug('incomeSearchResults.length',incomeSearchResults.length);			
    				for (var iTemp =0; iTemp < incomeSearchResults.length; iTemp++)
    				{
    			        var incomesource = {};
    			        var incomeloopsource = {}; 
    			        
    			        incomesource.account = incomeSearchResults[iTemp].getText({ name: 'account', summary: search.Summary.GROUP });
    			        incomesource.type = incomeSearchResults[iTemp].getText({ name: 'type', summary: search.Summary.GROUP });
    			        incomesource.tranid = incomeSearchResults[iTemp].getValue({ name: 'tranid', summary: search.Summary.GROUP });
    			        incomesource.trandate = incomeSearchResults[iTemp].getValue({ name: 'trandate', summary: search.Summary.MAX });
    			        incomesource.mainname = incomeSearchResults[iTemp].getText({ name: 'mainname', summary: search.Summary.GROUP }); 
    			        incomesource.memo = incomeSearchResults[iTemp].getValue({ name: 'memo', summary: search.Summary.GROUP });
    			        incomesource.amount = (incomeSearchResults[iTemp].getValue({ name: 'amount', summary: search.Summary.SUM })).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    			        incomeloopsource.values = incomesource;
    			        incomeResults.push(incomeloopsource);
    				}
    			}
	    		
    			//Fetching all results from cogs search   		
	    		var cogsSearchObj = search.load({
    			    id: cogsSearchId
    			});
    			
    			cogsSearchObj.filters.push(search.createFilter({
    			    name: 'custcoljobnbr',
    			    operator: search.Operator.ANYOF,
    			    values : jobId
    			}));
    			
    			var cogsSearchResults = cogsSearchObj.run().getRange({
	    			start: 0,
	    			end : 999
	    		})
    			
	    		//converting all cogs search results into required renderer data source
	    		var cogsResults = [];

    			if(cogsSearchResults)
    			{
    				log.debug('cogsSearchResults.length',cogsSearchResults.length);			
    				for (var jTemp =0; jTemp < cogsSearchResults.length; jTemp++)
    				{
    			        var cogssource = {};
    			        var cogsloopsource = {};
    			        
    			        cogssource.account = cogsSearchResults[jTemp].getText({ name: 'account', summary: search.Summary.GROUP });
    			        cogssource.type = cogsSearchResults[jTemp].getText({ name: 'type', summary: search.Summary.GROUP });
    			        cogssource.tranid = cogsSearchResults[jTemp].getValue({ name: 'tranid', summary: search.Summary.GROUP });
    			        cogssource.trandate = cogsSearchResults[jTemp].getValue({ name: 'trandate', summary: search.Summary.MAX });
    			        cogssource.mainname = cogsSearchResults[jTemp].getText({ name: 'mainname', summary: search.Summary.GROUP }); 
    			        cogssource.memo = cogsSearchResults[jTemp].getValue({ name: 'memo', summary: search.Summary.GROUP });
    			        cogssource.amount = (cogsSearchResults[jTemp].getValue({ name: 'amount', summary: search.Summary.SUM })).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    			        cogsloopsource.values = cogssource;
    			        cogsResults.push(cogsloopsource);
    				}
    			}
    			
    			//attaching the converted custom data source income search results to renderer 
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'income',
    			    data: {type : 'income', list : incomeResults }
    			});
    			
    			//attaching the converted custom data source cogs search results to renderer
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'cogs',
    			    data: {type : 'cogs', list : cogsResults}
    			});
//    			log.debug('incomeResults', incomeResults);
//    			log.debug('cogsResults', cogsResults);
    			//============================================= END combine logic ======================================	    
    			
    			xmlOutput = renderer.renderAsString();
    			
    			if (!(xmlOutput) || xmlOutput === null) throw {name: 'xmlOutput', message:'No output from template renderer.'};
    			
    			log.debug('Available Usage', runtime.getCurrentScript().getRemainingUsage());
    			
    			context.response.write(xmlOutput);
    		}catch(e){
    			log.debug(e.name, e.message);
    			log.debug('Available Usage:', runtime.getCurrentScript().getRemainingUsage());
    		}
    }
    

    return {
        onRequest: onRequestPrintGPAnalysis
    };
    
});