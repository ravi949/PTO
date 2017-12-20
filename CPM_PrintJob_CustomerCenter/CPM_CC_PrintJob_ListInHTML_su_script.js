/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/record', 'N/runtime', 'N/file', 'N/search','N/ui/serverWidget','N/url'],
/**
 * @param {http} render
 * @param {record} record
 * @param {runtime} runtime
 * @param {runtime} runtime
 * @param {search} search
 */
function(render, record, runtime, file, search,serverWidget,url) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var request = context.request, response = context.response,
    	userId = runtime.getCurrentUser().id;
    	if(request.method == 'GET'){
    		try{
//    			log.debug('context',request.parameters);
    			/**Getting the parameters from Client script(CPM_CC_PrintJob_List_Pagination_cs_script.js) through url.*/
    			var templateId = runtime.getCurrentScript().getParameter({name:'custscript_cpm_pjlistview_htmlfile_id'}),
    			sdate = request.parameters.sd,
    			edate = request.parameters.ed,
    			formate = request.parameters.fid,
    			title = request.parameters.title,
    			region = request.parameters.region,
    			jobCompleted = request.parameters.jbcflag,
    			jobCompleted = (jobCompleted)?true:false,
    			InternationalFlag = request.parameters.inflag,
    			InternationalFlag = (InternationalFlag)?true:false,
    			billed = request.parameters.bilflag,
    			billed = (billed)?true:false,
    			pagedIndex = (request.parameters.indx)?request.parameters.indx:0,
    			/**Adding filter to the search based on the user actions.*/
//    			searchFilter = [['custbody_cpm_printjob_format','noneof','@NONE@'],'and',['custbody_cpm_printjob_pagecount','noneof','@NONE@']];
    			searchFilter =[['entity','is',userId],'and',
    						   ['winlossreason','noneof',[12,13]]];
    			if(region){
    				searchFilter.push('and',['custbody_cseg_cpm_region','is',region]);
    			}
    			if(jobCompleted){
    				searchFilter.push('and',['custbodycompletedflag','is',jobCompleted]);
    			}
    			if(InternationalFlag){
    				searchFilter.push('and', ['custbodyintlflag','is',InternationalFlag]);
    			}
    			if(billed){
    				searchFilter.push('and', ['custbodybilledflag','is',billed]);
    			}

    			/**Loading Print Job search and applying the paged methods*/
    			var resultArray = [],
    				result = getResult(searchFilter,formate,title,sdate),
    			/**Getting the result as 25 per page*/
    			paged = result.runPaged({pageSize:25}),
    			pageCount = paged.count;
//    			log.debug('paged',paged.pageRanges.length)
//    			log.error('paged count',pagedIndex)
    			if(pageCount >0){
    				/**When user changes the pagination then adding the index to get required results*/
    					paged.fetch({index:pagedIndex}).data.forEach(function(e){
            				resultArray.push(e);
            				return true;
            			});   			
    			}

    			form = serverWidget.createForm({
    				title : 'Print Jobs'
    			});
    			form.addFieldGroup({
    				id:'custom_searchs',
    				label:' '
    			});
    			var submitBtn = form.addField({
    				id:'custpage_cpm_submitbtn',
    				type: serverWidget.FieldType.INLINEHTML,
    				label: 'Submit',
    				container:'custom_searchs'
    			});  			
    			submitBtn.defaultValue = '<br/><button type="button" class="btn" id="search_cpm_pj">Search</button>'
    				
    			var formateField = form.addField({
    				id:'custpage_cpm_format',
    				type: serverWidget.FieldType.SELECT,
    				label: 'Format',
    				source:'customlist_cpm_printformats', 
    				container:'custom_searchs'
    			}).updateBreakType({
    			    breakType : serverWidget.FieldBreakType.STARTROW
    			});
    			if(formate)
    				formateField.defaultValue = formate;
 
    			var titleDiscField = form.addField({
    				id:'custpage_cpm_titledescription',
    				type: serverWidget.FieldType.SELECT,
    				label: 'Title / Description',
    				container:'custom_searchs'
    			});
    			titleDiscField.addSelectOption({
    				value:' ',
    				text:' '
    			});
    			
    			var cpmTitleDiscription = search.create({
    				type:search.Type.OPPORTUNITY,
    				columns:['tranid','custbody18'],
  				         filters:searchFilter
//    				         filters:[]
    			}).run().each(function(e){
    				if(e.getValue('custbody18')){
    					titleDiscField.addSelectOption({
    						value :e.getValue('custbody18'),
    						text : e.getValue('custbody18'),
    						isSelected:(title == e.getValue('custbody18'))
    					});
    				}
    				return true;
    			});
    			
    			var regionField = form.addField({
    				id:'custpage_cpm_region',
    				type: serverWidget.FieldType.SELECT,
    				label: 'Region',
    				source:'customrecord_cseg_cpm_region',
    				container:'custom_searchs'
    			}).updateBreakType({
    			    breakType : serverWidget.FieldBreakType.STARTCOL
    			}).defaultValue = (region)?region:'';
    			var startDateField = form.addField({
    				id:'custpage_cpm_startdate',
    				type: serverWidget.FieldType.DATE,
    				label: 'Start Date',
    				container:'custom_searchs'
    			});
    			if(sdate)
    				startDateField.defaultValue = sdate;

    			var endDateField = form.addField({
    				id:'custpage_cpm_enddate',
    				type: serverWidget.FieldType.DATE,
    				label: 'End Date',
    				container:'custom_searchs'
    			});
    			if(edate)
    				endDateField.defaultValue = edate;
    			
    			var jobCompletedField = form.addField({
    				id:'custpage_cpm_jobcompleted',
    				type: serverWidget.FieldType.CHECKBOX,
    				label: 'Job Completed Flag',
    				container:'custom_searchs'
    			}).updateBreakType({
    			    breakType : serverWidget.FieldBreakType.STARTCOL
    			});
    			jobCompletedField.defaultValue = (jobCompleted)?'T':'F';
    			
    			var InternationalFlagField = form.addField({
    				id:'custpage_cpm_internationalflag',
    				type: serverWidget.FieldType.CHECKBOX,
    				label: 'International Flag',
    				container:'custom_searchs'
    			});
    			InternationalFlagField.defaultValue = (InternationalFlag)?'T':'F';
    			
    			var billedFlagField = form.addField({
    				id:'custpage_cpm_billedflag',
    				type: serverWidget.FieldType.CHECKBOX,
    				label: 'Billed Flag',
    				container:'custom_searchs'
    			});
    			billedFlagField.defaultValue = (billed)?'T':'F';
    			
    				
    			// Getting the suite script URL by using the script parameter to show record 
    			var scriptObj = runtime.getCurrentScript(),
    			printjobsuiteletURL = url.resolveScript({
    				scriptId: scriptObj.getParameter({name:'custscript_cpm_su_pjviewscriptid'}),
    				deploymentId: scriptObj.getParameter({name:'custscript_cpm_supj_viewdeploymentid'}),
    				returnExternalUrl: false
    			});	
    				
    			/**Loading the HTML file to view Print Jobs list*/
    			var fileObj = file.load(templateId);
    			var renderer = render.create();
    			renderer.templateContent = fileObj.getContents();
    			renderer.addCustomDataSource({
    				format: render.DataSource.OBJECT,
    				alias: "PJList",
    				data: {data:JSON.stringify(resultArray),totalCount:pageCount,pages:paged.pageRanges.length,pageIndex:pagedIndex,pjurl:printjobsuiteletURL}
    			});
    			var output_template = renderer.renderAsString();
    			form.addFieldGroup({
    				id:'custom_htmlview',
    				label:' '
    			});
    			var field = form.addField({
    				id : 'custpage_inlinefield',
    				type : serverWidget.FieldType.INLINEHTML,
    				label : 'Text',
    				container:'custom_htmlview'
    			}).defaultValue = output_template
    			
    			form.addButton({
    				id:'custpage_dwnload_btn',
    				label:'Download',
    				functionName:'downloadCSV()'
    			});
    			
    			/**Loading Client script path*/
    			form.clientScriptModulePath  = './CPM_CC_PrintJob_List_Pagination_cs_script.js';

    			response.writePage(form);

    		}catch(e){
    			log.debug('Exception Occures',e);
    		}
    	}else if(request.method == 'POST'){
    		try{
    			
    			var sdate = request.parameters.custpage_cpm_startdate,
    			edate = request.parameters.custpage_cpm_enddate,
    			formate = request.parameters.custpage_cpm_format,
    			title = request.parameters.custpage_cpm_titledescription,
    			region = request.parameters.custpage_cpm_region,
    			jobCompleted = request.parameters.custpage_cpm_jobcompleted;
    			InternationalFlag = request.parameters.custpage_cpm_internationalflag,
    			billed = request.parameters.custpage_cpm_billedflag,
    			billed = (billed)?true:false,
    			jobCompleted = (jobCompleted)?true:false,
    			InternationalFlag = (InternationalFlag)?true:false,
//    			searchFilter = [['custbody_cpm_printjob_format','noneof','@NONE@'],'and',['custbody_cpm_printjob_pagecount','noneof','@NONE@']];
    			searchFilter =[['entity','is',userId],'and',
    						   ['winlossreason','noneof',[12,13]]];		
    					
    			if(region){
    				searchFilter.push('and',['custbody_cseg_cpm_region','is',region]);
    			}
    			if(jobCompleted){
    				searchFilter.push('and',['custbodycompletedflag','is',jobCompleted]);
    			}
    			if(InternationalFlag){
    				searchFilter.push('and', ['custbodyintlflag','is',InternationalFlag]);
    			}
    			if(billed){
    				searchFilter.push('and', ['custbodybilledflag','is',billed]);
    			}
	    			
    			/**Loading Print Job search and applying the paged methods*/
    			var result = getResult(searchFilter,formate,title,sdate),
    			
    			/**Getting the result as 25 per page*/
    			paged = result.runPaged({pageSize:25}),
    			pageCount = paged.pageRanges.length;
    			
    			response.setHeader("Content-Description","File Transfer"); 
				response.setHeader("Content-type","application/octet-stream; charset=utf-8");
				response.setHeader("Content-disposition","attachment; filename=printjobs.csv");

				//csv spreadsheet headers
				response.write("Job Number,Title/Description,Project,Format,PageCount,Estimated Quantity,BRC Quantity,Job Specs,Files DueDate,Bind Date,InHome Date,Proof Deadline,Print Date,Ship Date1,Ship Date2\n");
				var row = [];
    			for(var i = 0;i< pageCount;i++){
    				var fetchedData = paged.fetch({index: i}).data;
    				for(j in fetchedData){
    						row = [
        						fetchedData[j].getValue('tranid'),
        						fetchedData[j].getValue('custbody18'),
        						fetchedData[j].getValue('custbody12'),
        						fetchedData[j].getText('custbody_cpm_printjob_format'),
        						fetchedData[j].getText('custbody_cpm_printjob_pagecount'),
        						fetchedData[j].getValue('custbodyestqty'),
        						fetchedData[j].getValue('custbody_cpm_printjob_brcquantity'),
        						fetchedData[j].getValue('memo').replace(/&lt;br&gt;/g,'\r\n'),
        						fetchedData[j].getValue('custbodydtefiles'),
        						fetchedData[j].getValue('custbodydtebind'),
    							fetchedData[j].getValue('custbodydteiinhome'),     
    							fetchedData[j].getValue('custbodydteproof'),
    							fetchedData[j].getValue('custbodydteprint'),
    							fetchedData[j].getValue('custbodydteship1'),
    							fetchedData[j].getValue('custbodydteship2'),
        					]
    					
    					row = row.map(function(field) {
    	                    return '"' + field.replace(/"/g, '""') + '"';
    	                });

    	                response.write(row.join() + "\n");
    				}
    			
    			}
    			
    			log.debug('remaining usage',runtime.getCurrentScript().getRemainingUsage())
    		}catch(e){
    			log.debug('exception in post method download csv',e)
    		}
		}
    		
    }
    
    
    
    //get search result
    function getResult(searchFilter,formate,title,sdate){
    	if(formate){
			searchFilter.push('and',['custbody_cpm_printjob_format','is',formate]);
			log.debug('formate',formate);
		}
		if(title && title != " "){
			searchFilter.push('and',['custbody18','is',title])
			log.debug('tittle', title);
		}
		if(sdate){
			searchFilter.push('and',["trandate","on",sdate]);
			log.error('sdate',sdate);
		}	
		
		/**Loading Print Job search and applying the paged methods*/
		var result = search.create({
			type:search.Type.OPPORTUNITY,
			columns:['internalid'
			         ,'tranid'
			         ,'custbody18'
			         ,'custbody12'
			         ,'custbodyestqty'
			         ,'custbody_cpm_printjob_format'
			         ,'custbody_cpm_printjob_pagecount'
			         ,'custbody_cpm_printjob_brcquantity'
			         ,'memo'
			         ,'custbodydtefiles'
			         ,'custbodydtebind'
			         ,'custbodydteiinhome'
			         ,'custbodydteproof'
			         ,'custbodydteprint'
			         ,'custbodydteship1'
			         ,'custbodydteship2'
			         ,'winlossreason'
			         ],
			         filters:searchFilter
		})
		
		return result;
		
    }

    return {
        onRequest: onRequest
    };
    
});
