/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],
		/**
		 * @param {search} search
		 */
		function(search) { 



	function pageInit(scriptContext) {
		try{
			if(scriptContext.currentRecord.getValue('billaddress')){
				getVatregnum(scriptContext.currentRecord);
			}

		}catch(e){
			log.debug(e.name,e.message);
		}

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
		try{
			if(scriptContext.fieldId === 'billaddress'){        		
				if(scriptContext.currentRecord.getValue('billaddress')){
					getVatregnum(scriptContext.currentRecord);
				}
			}
		}catch(e){
			log.debug(e.name,e.message);
		}

	}
	function getVatregnum(currentRecord){
		var billAddress = currentRecord.getValue('billaddress').split('\n');					
		if(billAddress[billAddress.length-1]){	
			
			//search for country from customer bill address in vat registartion record
			var  searchForCountry = search.create({
				type: 'customrecord_cpm_vat_registration_id',
				filters: [["formulatext: {custrecord_cpm_tax_nexus}","contains",billAddress[billAddress.length-1]]],
				columns: ["custrecord_cpm_vat_reg_id"]
			});    			
			if(searchForCountry.runPaged().count){   
				//setting vat reg no field value in invoice 
				currentRecord.setValue('custbody_calev_vatregistration', searchForCountry.run().getRange(0,1)[0].getValue('custrecord_cpm_vat_reg_id'));
			}    			
		} 
	}



	return {   
		pageInit: pageInit,
		fieldChanged: fieldChanged
	};

});
