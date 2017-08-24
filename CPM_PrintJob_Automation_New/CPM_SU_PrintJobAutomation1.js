/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Requires script parameters - 
 * Item Search 'custscript_cpm_pj_automationitemsearch'
 * Paper Search 'custscript_cpm_pj_automationpapersearch'
 * Suitelet ID 'custscript_cpm_pj_automationscriptid'
 * Deployment ID 'custscript_cpm_pj_automationdeploymentid'
 */
define(['N/record',
		'N/search',
		'N/runtime',
		'N/redirect',
		'./CPM_PrintJob_Module.js'],

function(record, search, runtime, redirect,cpm) {
	 /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	try{
    		var scriptObj = runtime.getCurrentScript();
    		var groupSearch = scriptObj.getParameter({name:'custscript_cpm_pj_automationitemsearch'});
    		var paperSearch = scriptObj.getParameter({name:'custscript_cpm_pj_automationpapersearch'});
    		var pjid = context.request.parameters.pjid,paramObj;
    		log.audit('AUTOMATION', 'Suitelet 1 called for ' + context.request.parameters.pjid + ' and context ' + runtime.executionContext);
    		var pj = record.load({
    			type : record.Type.OPPORTUNITY,
    			id : pjid,
    			isDynamic : true
    		});
    		var formatId = pj.getValue({fieldId : 'custbody_cpm_printjob_format'});
    		var pageCount = pj.getValue({fieldId : 'custbody_cpm_printjob_pagecount'});
    		var vendorId = pj.getValue({fieldId : 'custbodyvndrawarder'});
    		var equipmentId = pj.getValue({fieldId : 'custbody_cpm_printjob_equipment'});
    		var versions = pj.getValue({fieldId : 'custbody_cpm_printjob_versions'});
    		var printQty = pj.getValue({fieldId : 'custbodyestqty'});
    		log.debug('page count',pageCount);
    		log.debug('format id',formatId);
    		//BRC/Insert item category and Units id
    		var itemCatId = scriptObj.getParameter({name:'custscript_cpm_pj_automationbrcinsert'}),
    		perThousandId = scriptObj.getParameter({name:'custscript_cpm_pj_automationper1000'}),
    		perJobId = scriptObj.getParameter({name:'custscript_cpm_pj_automationperjob'}),
    		mfgBRCItemId = scriptObj.getParameter({name:'custscript_cpm_pj_automationmfgbrc'}); 
             
            log.debug('itemCatID',itemCatId);
            log.debug('perThousandId',perThousandId);
            log.debug('perJobId',perJobId);
            log.debug('mfgBRCItemId',mfgBRCItemId);
            

    		//clear lines
    		var lineCount = pj.getLineCount({sublistId:'item'});
    		for(var i = lineCount-1; i >=0; i--){
    			pj.removeLine({
    				sublistId: 'item', line: i
    			});
    		}
    		//saving the record without checking for mandatory fields
    		pj.save({enableSourcing:false,ignoreMandatoryFields:true}); 
    		
    		//clear paper records
    		search.create({
    			type: 'customrecord_cpm_paper_record',
    			filters : [['custrecord_cpm_paper_printjob','anyof',pjid]],
    			columns : ['internalid']
    		}).run().each(function(result){
    			record.delete({
    				type: 'customrecord_cpm_paper_record',
    				id: result.getValue({name:'internalid'})
    			});
    			return true;
    		});
    		
    		//its searches for cpm-estimate record and returns the record id and itemgroup id
    		var arrEstAndGroup = cpm.getEstimateAndGroup(formatId, pageCount);

    		if(arrEstAndGroup.length >0){
    			if(util.isArray(arrEstAndGroup)){
    				var estimateId = arrEstAndGroup[0];
    				var groupId = arrEstAndGroup[1];
    				var linesAdded = cpm.addLineItems(groupSearch, groupId, pjid,itemCatId,perJobId,mfgBRCItemId);
    				var paperAdded = cpm.addPaperItems(paperSearch, estimateId, pjid, vendorId, equipmentId, versions, printQty,perThousandId);

    				if(context.request.parameters.from == 'cc'){
    					paramObj = {'pjid' : pjid,from:'cc'}
    				}else{
    					paramObj = {'pjid' : pjid }
    				}
    				
    				redirect.toSuitelet({
    					scriptId: scriptObj.getParameter({name:'custscript_cpm_pj_automationscriptid'}),
    					deploymentId: scriptObj.getParameter({name:'custscript_cpm_pj_automationdeploymentid'}),
    					parameters : paramObj
    				});
    			}
    		}else {
    			//log.error('Records Not Found','There are no Estimation records found for the Format and Page Count entered on the Print Job(Internal Id: '+pjid+').');
    			throw new Error({name:'Record Not Found',message:'There are no CPM Estimation records found for the Format and Page Count entered on the Print Job(Internal Id: '+pjid+').'});
    			
    			redirect.toRecord({
    				type : record.Type.OPPORTUNITY, 
    				id : pjid 
    			});
    		}
    	} catch (ex) {
			log.error(ex.name, ex.message);
			if(ex.name == 'Record Not Found'){
				cpm.setFailed(pjid);
				throw new Error(ex.message);
			}
//			return false;
		}
    }

    return {
        onRequest: onRequest
    };
    
});