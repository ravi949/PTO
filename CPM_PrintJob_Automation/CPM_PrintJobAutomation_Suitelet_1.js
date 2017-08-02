/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Requires script parameters - 
 * Item Search 'custscript_cpm_pja_v2_itemsearch'
 * Paper Search 'custscript_cpm_pja_v2_papersearch'
 * Suitelet ID 'custscript_cpm_pja_v2_suitelet2'
 * Deployment ID 'custscript_cpm_pja_v2_deployment2'
 */
define(['N/record', 'N/search', 'N/runtime', 'N/redirect'],

function(record, search, runtime, redirect) {
	
	/**
	 * @param {String} required formatId Internal Id of the format
	 * @param {String} required pageCntId Internal Id of the page count
	 * @returns {Array}
	 */
	function getEstimateAndGroup(formatId, pageCntId) {
		try{
			var searchEstimations = search.load({
				type : 'customrecord_cpm_estimation',
				id: 'customsearch_cpm_get'
			});
			searchEstimations.filters.push(search.createFilter({
				name:'custrecord_cpm_printjobformat',
				operator: search.Operator.ANYOF,
				values: formatId
			}));
			searchEstimations.filters.push(search.createFilter({
				name:'custrecord_cpm_formatpagecount',
				operator: search.Operator.ANYOF,
				values: pageCntId
			}));
			/*var searchEstimations = search.create({
			type : 'customrecord_cpm_estimation',
			filters : [
			           ['custrecord_cpm_printjobformat', 'anyof', formatId], 'and',
			           ['custrecord_cpm_formatpagecount', 'anyof', pageCntId]
			           ],
			columns : ['internalid', 'custrecord_cpm_estimation_ig']
		    });*/
			var returnValue = [];
			searchEstimations.run().each(function(estimate){
				returnValue.push(estimate.getValue('internalid'));
				returnValue.push(estimate.getValue('custrecord_cpm_estimation_ig'));
				return false;
			});
			log.debug('returnValue',returnValue);
			return returnValue;
		}catch(e){
			log.error(ex.name, ex.message, true);
			return false;
		}
	}
	
	/**
	 * @param {String} searchId
	 * @param {String} groupId
	 * @param {String} printJobId
	 * @returns {Boolean}
	 */
	function addLineItems(searchId, groupId, printJobId,itemCatId,perJobId,mfgBRCItemId) {
		try{
			var itemGroupSearch = search.load({
				id : searchId
			});
			itemGroupSearch.filters.push(search.createFilter({
				name : 'internalid',
				operator : search.Operator.ANYOF,
				values : groupId
			}));
			var pj = record.load({
				type : record.Type.OPPORTUNITY, 
				id : printJobId,
				isDynamic: true
			});
			var versions = pj.getValue({fieldId: 'custbody_cpm_printjob_versions'}), 
				estqty = pj.getValue({fieldId: 'custbodyestqty'}),
				brcqty = pj.getValue({fieldId: 'custbody_cpm_printjob_brcquantity'}),
				flag = true;
			log.debug('itemCatId',itemCatId)
			itemGroupSearch.run().each(function(line){
				var lQty = null, 
					itemId = line.getValue('memberItem'),
					iCat = line.getValue({name:'custitem_cpm_itemcategory', join:'memberItem'}), 
					verQty = line.getValue({name: 'custitem_cpm_item_version', join:'memberItem'}),
					mQty = line.getValue('memberQuantity'), 
					unit = line.getValue({name:'saleunit', join: 'memberItem'}),
					brcBuffer = line.getValue({name:'custitem_cpm_quantitybuffer', join: 'memberItem'});
				if (brcBuffer != '' && brcBuffer != null){
					brcBuffer = parseFloat(brcBuffer);
				} else {
					brcBuffer = 0;
				}
				if (itemId == mfgBRCItemId && iCat == itemCatId){// is BRC / Insert type  //newly added the brc item id compare
					lQty = mQty * brcqty * (1 + (brcBuffer/100));
				} else {// regular type
					lQty = (iCat == itemCatId)?mQty * brcqty:mQty * estqty;  //newly added for brcQty and estQty for BRC/Insert
					//lQty = mQty * estqty;
				}
				if (unit == perJobId) { //per job
					lQty = mQty;
					if (verQty) {
						lQty = lQty * parseInt(versions);
					}
				}
				//add line items
				pj.selectNewLine({sublistId : 'item'});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'item',
					value : itemId,
					ignoreFieldChange : false
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'quantity',
					value : lQty,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'price',
					value : -1,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'rate',
					value : 0,
					ignoreFieldChange : false
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'custcol_cpm_pj_include',
					value : true,
					ignoreFieldChange : true
				});
				pj.setCurrentSublistValue({
					sublistId : 'item',
					fieldId : 'custcoljobnbr',
					value : printJobId,
					ignoreFieldChange : true
				});
				pj.commitLine({
					sublistId : 'item'
				});
				return true;
			});
			pj.save({
				enableSourcing : false,
    			ignoreMandatoryFields : true  //mainly it is set false:- latest
			});
			return true;
		} catch(ex){
			log.error(ex.name, ex.message, true);
			return false;
		}
	}
	
	/**
	 * @param {String} searchId
	 * @param {String} estimateId
	 * @param {String} printJobId
	 * @param {String} vendorId
	 * @param {String} equipmentId
	 * @param {String} versions
	 * @returns {Boolean}
	 */
	function addPaperItems(searchId, estimateId, printJobId, vendorId, equipmentId, versions, printQty,perThousandId){
		try{
			var searchPaper = search.load({id:searchId});
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_format',
				operator : search.Operator.ANYOF,
				values : estimateId
			}));
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_vendor',
				operator : search.Operator.ANYOF,
				values : vendorId
			}));
			searchPaper.filters.push(search.createFilter({
				name : 'custrecord_cpm_est_paper_equipment',
				operator : search.Operator.ANYOF,
				values : equipmentId
			}));
			var sumAllowance = 0;
			searchPaper.run().each(function(estPapRec){	
				log.debug('estPapRec',estPapRec)
				var qty = null, isVersions = estPapRec.getValue({name:'custitem_cpm_paper_version', join:'CUSTRECORD_CPM_EST_PAPER_CONBY'});
				qty = parseFloat(estPapRec.getValue('custrecord_cpm_est_paper_amount')),
				defaultPaperItem = estPapRec.getValue('custrecord_cpm_est_paper_defaltpaperitem');
				var unit = estPapRec.getValue({name:'saleunit', join:'CUSTRECORD_CPM_EST_PAPER_CONBY'})
				if (isVersions) {
					qty = qty * parseInt(versions);
				} else if(unit==perThousandId){  //equal to per 1000
					qty = qty * parseInt(printQty) / 1000;
				}

				var paperRec = record.create({
					type : 'customrecord_cpm_paper_record',
					isDynamic : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_printjob',
					value : printJobId,
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_included',
					value : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_size',
					value : estPapRec.getValue('custrecord_cpm_est_paper_size'),
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_allowance',
					value : Math.round(qty)
				}).setValue({
					fieldId : 'custrecord_cpm_paper_consumedby',
					value : estPapRec.getValue('custrecord_cpm_est_paper_conby'),
					fireSlavingSync : true
				}).setValue({
					fieldId : 'custrecord_cpm_paper_allowanceper',
					value : estPapRec.getValue('custrecord_cpm_est_paper_amount')
				})
				
				//default paper item set to the newly created paper record
				if(defaultPaperItem != ''){
					paperRec.setValue({
						fieldId:'custrecord_cpm_paper_item',
						value:defaultPaperItem
					})
				}
				
				paperRec.save({
					enableSourcing : false,
	    			ignoreMandatoryFields : true
				});
				sumAllowance += qty;
				return true;			
			});
			log.debug('sumAllowance',sumAllowance)
			record.submitFields({
				type : record.Type.OPPORTUNITY,
				id : printJobId,
				values : {
					custbodypaperallowance : Math.round(sumAllowance)
				}
			});
			return true;
		} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
	}
	
	
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
    		var groupSearch = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_itemsearch'});
    		var paperSearch = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_papersearch'});
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
    		log.debug('page count',pageCount)
    		log.debug('format id',formatId)
    		//BRC/Insert item category and Units id
    		var itemCatId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_s1_brcinsert_catid'}),
    		perThousandId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_s1_per1000_id'}),
    		perJobId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_s1_perjob_id'}),
    		mfgBRCItemId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_s1_brcitemid'}); 
             
            log.debug('itemCatID',itemCatId)
            log.debug('perThousandId',perThousandId)
            log.debug('perJobId',perJobId)
            log.debug('mfgBRCItemId',mfgBRCItemId)
            

    		//clear lines
    		var lineCount = pj.getLineCount({sublistId:'item'});
    		for(var i = lineCount-1; i >=0; i--){
    			pj.removeLine({
    				sublistId: 'item', line: i
    			});
    		}
    		//pj.save(); //main code:- latest
    		pj.save({enableSourcing:false,ignoreMandatoryFields:true}); //taj added the line for testing 
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

    		var arrEstAndGroup = getEstimateAndGroup(formatId, pageCount);

//  		log.debug('arrEstAndGroup',arrEstAndGroup.length)
//  		log.debug('util.isArray(arrEstAndGroup)',util.isArray(arrEstAndGroup))
    		if(arrEstAndGroup.length >0){
    			if(util.isArray(arrEstAndGroup)){
    				var estimateId = arrEstAndGroup[0];
    				var groupId = arrEstAndGroup[1];
    				var linesAdded = addLineItems(groupSearch, groupId, pjid,itemCatId,perJobId,mfgBRCItemId);
    				var paperAdded = addPaperItems(paperSearch, estimateId, pjid, vendorId, equipmentId, versions, printQty,perThousandId);

    				if(context.request.parameters.from == 'cc'){
    					paramObj = {'pjid' : pjid,from:'cc'}
    				}else{
    					paramObj = {'pjid' : pjid }
    				}
    				
    				redirect.toSuitelet({
    					scriptId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_suitelet2'}),
    					deploymentId: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pja_v2_deployment2'}),
    					parameters : paramObj
    				});
    			}
    		}else {
    			log.error('','There are no Estimation records found for the Format and Page Count entered on the Print Job(Internal Id: '+pjid+').');
    			redirect.toRecord({
    				type : record.Type.OPPORTUNITY, 
    				id : pjid 
    			});
    		}
    	} catch (ex) {
			log.error(ex.name, ex.message);
			return false;
		}
    }

    return {
        onRequest: onRequest
    };
    
});