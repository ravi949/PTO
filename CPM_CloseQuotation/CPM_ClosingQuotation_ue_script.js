/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
		/**
		 * @param {record} record
		 * @param {search} search
		 */
		function(record, search) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) 
	{
		var CurrentRecord=scriptContext.newRecord;
		var recordType = scriptContext.newRecord.type;
		var Type = scriptContext.type;

		if(Type == 'create' && recordType=='estimate')
		{
			var PrintJobId = CurrentRecord.getValue({fieldId:'opportunity'});
			/*	var PrintjobRec=record.load({
				type : record.Type.OPPORTUNITY,
				id : PrintJobId
			});*/
			/*	var Status = PrintjobRec.getValue({fieldId:'status'});
			log.debug('Status', Status);*/

			if(PrintJobId!='' && PrintJobId!='null')
			{
				/*var salesorderRec = search.create({
					type:search.Type.SALES_ORDER,
					columns: ['internalid','status'],
					filters: [['opportunity','anyof',PrintJobId],'and',
						['status','noneof',['closed','cancelled']],'and',
						['mainline','is','T']]
				}).run().getRange(0,5);
				if (salesorderRec.length > 0) 
				{
					throw Error('Already Sales Order has been created and Not allowed to create new Quotation.');
				}*/
				//getting the Quotations and related Sales Orders statuses for creating new Quotation 
				var Estimate = search.create({
					type : search.Type.ESTIMATE,
					columns : ['internalid'],
					filters :  [['opportunity', 'anyof', PrintJobId], 'and', 
						['mainline', 'is', true]]			
				}).run().each(function(e){
					var quationId = e.getValue({name:'internalid'});
					var salesorderRec = search.create({
						type:search.Type.SALES_ORDER,
						columns: ['internalid','status'],
						filters: [['createdfrom','anyof',quationId],'and',
							['status','noneof',["SalesOrd:C","SalesOrd:H"]],'and',
							['mainline','is','T']]
					}).run().getRange(0,5);
					/*if any Quotation in print job have Sales Orders with status not 
					      cancelled or close then restrict user to create a new Quote for current Print Job*/
					if (salesorderRec.length > 0) 
					{
						throw Error('Already Sales Order has been created and Not allowed to create new Quotation.');
					}
					return true;
				});
			}
		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) 
	{
		var CurrentRecord=scriptContext.newRecord;
		var Id=CurrentRecord.id;			    	
		var PrintJobId = CurrentRecord.getValue({fieldId:'opportunity'});

		var Estimate = search.create({
			type : search.Type.ESTIMATE,
			columns : ['internalid'],
			filters :  [['opportunity', 'anyof', PrintJobId], 'and', 
				['entitystatus', 'noneof', 14], 'and', 
				['mainline', 'is', true], 'and',
				['internalid', 'noneof', Id]]			
		}).run().each(function(e){
			var id = e.getValue({name:'internalid'});
			var EstimateRec=record.load({
				type : record.Type.ESTIMATE,
				id : id
			});
			EstimateRec.setValue({
				fieldId : 'entitystatus',
				value	: 14
			});
			EstimateRec.save({
				enableSourcing : true,
				ignoreMandatoryFields : true
			});
			return true;
		});
	}

	return {
		beforeLoad: beforeLoad,
		afterSubmit: afterSubmit
	};

});
