/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime',
    	'N/record',
    	'N/redirect',
    	'N/search'
    	],

function(runtime, record, redirect, search) {
	
	/**
	 * @param printJobId
	 * @returns paper search result
	 */
	function getPaperRecords(printJobId) {
		var paperSearch = search.load({
			type: 'customrecord_cpm_paper_record',
			id: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_recalpapersearch'})
		});
		paperSearch.filters.push(search.createFilter({
			name: 'custrecord_cpm_paper_printjob',
			operator: search.Operator.ANYOF,
			values: printJobId
		}));
		return paperSearch;
	}
	
	/**
	 * @param printJobId
	 * @returns sum of allowance 
	 * @description load the paper search and sum of the paper allowance values.
	 */
	function getPaperAllowance(printJobId) {
		var allowance = 0;
		var paperSearch = search.load({
			type: 'customrecord_cpm_paper_record',
			id: runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_recalpaperallsearch'})
		});
		paperSearch.filters.push(search.createFilter({
			name: 'custrecord_cpm_paper_printjob',
			operator: search.Operator.ANYOF,
			values: printJobId
		}));
		paperSearch.run().each(function(result){
			allowance = result.getValue({
				name: 'custrecord_cpm_paper_allowance',
				summary: search.Summary.SUM
			});
			return false;
		});
		return allowance;
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
		log.audit('Recalc_Start', 'For Print Job ID: ' + context.request.parameters.pjid);
		var printJobId = context.request.parameters.pjid,
		paperSuppliedBy = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_recalpapersupby'}), //item category Customer Supplied
		paperItemCatId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pj_recalitemcategory'}); //item category Paper

		var printJob = record.load({
			type: record.Type.OPPORTUNITY,
			id: printJobId,
			isDynamic: true
		});
		var lineCount = printJob.getLineCount({
			sublistId: 'item'
		});

		for (var i = lineCount-1; i >= 0; i--){
			var itemCategory = printJob.getSublistValue({
				sublistId: 'item',
				fieldId: 'custcol_cpm_itemcategory',
				line: i
			});
			if (itemCategory == paperItemCatId) { //itemCategory is equal to Paper
				printJob.removeLine({
					sublistId: 'item', line: i
				});
			}
		}
		var pjPaperSuppliedBy = printJob.getValue({
			fieldId: 'custbodypprsupplied'
		});
		
		if (pjPaperSuppliedBy == paperSuppliedBy){  //paper supplied by (customer supplied) id is 2
			getPaperRecords(printJobId).run().each(function(result){
				log.debug('item',result.getValue({
						name: 'custrecord_cpm_paper_item',
						summary: search.Summary.GROUP
					}));
				printJob.selectNewLine({
					sublistId: 'item' 
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					value : result.getValue({
						name: 'custrecord_cpm_paper_item',
						summary: search.Summary.GROUP
					})
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'units',
					value : '4'
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'quantity',
					value : result.getValue({
						name: 'custrecord_cpm_paper_allowance',
						summary: search.Summary.SUM
					})
				});
				printJob.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'amount',
					value : '0'
				});
				printJob.commitLine({
					sublistId: 'item'
				});
				return true;
			});
		} 

		printJob.setValue({
			fieldId: 'custbodypaperallowance',
			value: Math.round(getPaperAllowance(printJobId))
		});

		printJob.save();

		redirect.toRecord({
			id: printJobId,
			type: record.Type.OPPORTUNITY,
			isEditMode: false
		});
	}

    return {
        onRequest: onRequest
    };
    
});
