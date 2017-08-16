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
    			var incomeSearchObj = search.load({
    			    id: incomeSearchId
    			});
    			
    			incomeSearchObj.filters.push(search.createFilter({
    			    name: 'custcoljobnbr',
    			    operator: search.Operator.ANYOF,
    			    values : jobRec
    			}));
    			
    			var incomeSearchResults = incomeSearchObj.run().getRange({
	    			start: 0,
	    			end : 999
	    		})

	    		var cogsSearchObj = search.load({
    			    id: cogsSearchId
    			});
    			
    			cogsSearchObj.filters.push(search.createFilter({
    			    name: 'custcoljobnbr',
    			    operator: search.Operator.ANYOF,
    			    values : jobRec
    			}));
    			
    			var cogsSearchResults = cogsSearchObj.run().getRange({
	    			start: 0,
	    			end : 999
	    		})
    			
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'income',
    			    data: {type : 'income', list : incomeSearchResults}
    			    });
    			
    			renderer.addCustomDataSource({
    			    format: render.DataSource.OBJECT,
    			    alias: 'cogs',
    			    data: {type : 'cogs', list : cogsSearchResults}
    			    });
    			//============================================= END combine logic ======================================	    
    			
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