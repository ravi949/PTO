/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record','N/search'],

		function(record,search) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @Since 2016.1
	 */
	function onAction(scriptContext) {	
		try{
			var empid = scriptContext.newRecord.getValue('custrecord_cpm_parent');		
			var fieldLookUp = search.lookupFields({
				type: search.Type.EMPLOYEE,
				id: empid,
				columns: ['workcalendar','custentity_cpm_emppto_availableforuse']
			});		
			log.debug('fieldLookUp',fieldLookUp.custentity_cpm_emppto_availableforuse);
			log.debug('fieldLookUp',fieldLookUp.workcalendar[0].value);
			var ptodate = fieldLookUp.custentity_cpm_emppto_availableforuse;		
			var loadedRec = record.load({
				type:'workcalendar',	
				id: fieldLookUp.workcalendar[0].value
			});
			var count= loadedRec.getLineCount('workcalendarexception');

			var hldays='';
			for(i=0;i<count;i++){
				var sublistFieldValue = loadedRec.getSublistText({
					sublistId: 'workcalendarexception',
					fieldId: 'exceptiondate',
					line: i
				});
				if(i==(count-1)){
					hldays = hldays+sublistFieldValue;
				}
				else{
					hldays = hldays+sublistFieldValue+',';
				}			
			}
			
			return hldays;
			var hldays =[];
			var holidayarr = hldays.replace(/\n/ig, ',').trim();
			holidayarr = holidayarr.split(',');
			log.debug('holidays',hldays[0]);
		}catch(e){
			log.debug(e.name,e.message);
		}		
	}
	return {
		onAction : onAction
	};

});
