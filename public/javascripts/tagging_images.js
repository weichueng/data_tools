$(function(){
 $('#get').on('click', function(e){
 	 var page = $('#page').text();
 	 if (typeof page == 'undefined' || page == null || page == ''){
 	 	page = 1;
 	 } else {
 	 	page = parseInt(page) + 1;
 	 };
 	 $('#page').html(page); 
     var parameters = { page: page };
     $.get( '/tagging_images',parameters, function(data) {
       console.log(data);
       result_string = '';
       var hc = JSON.parse(data);

       for (i = 0; i < hc.length; i++){
          result_string += '<tr>';
       	  result_string += '<td><img width="160" height="160"  rel="'+hc[i].id+'" src="' + hc[i].url + '" /></td>';
          result_string += '<td><span id="span'+hc[i].id+'"><span></td>';
       	  result_string += '<td><input type="button" value="copy" rel="'+hc[i].id+'" id="btncopy'+hc[i].id+'" class="copyClick" /> </td>';
          result_string += '<td><input type="button" value="cancel" rel="'+hc[i].id+'" id="btncancel'+hc[i].id+'" class="cancelClick" /> </td>';
          result_string += '</tr>';
       }
       $('#results').html(result_string);
         bindClickFunction();
     });
   
 });
 $('#get').trigger('click');
});


function bindClickFunction()
{
  $('.copyClick').click(function(data){
    var id  = $(this).attr('rel');
    $.ajax({
        type: "POST",
        url: "/tagging_images/updatePhoto",
        contentType: "application/json",
        data: JSON.stringify({ "id" : id}) ,
        type: 'post',
        dataType: 'json',
        async: false,
        success: function (data) {
            console.log(data);
            $('#span' + id).text('copied');
            $('#btncopy' + id).prop('disabled', true).removeClass('copyClick');
            $('#btncancel' + id).prop('disabled', true).removeClass('cancelClick');
        },
        error: function (error) {
            alert(error.status + "<--and--> " + error.statusText);
        }
    });
  });


  $('.cancelClick').click(function(data){
    var id  = $(this).attr('rel');
    $.ajax({
        type: "POST",
        url: "/tagging_images/cancelPhoto",
        contentType: "application/json",
        data: JSON.stringify({ "id" : id}) ,
        type: 'post',
        dataType: 'json',
        async: false,
        success: function (data) {
            console.log(data);
            $('#span' + id).text('cancel');
            $('#btncopy' + id).prop('disabled', true).removeClass('copyClick');
            $('#btncancel' + id).prop('disabled', true).removeClass('cancelClick');
        },
        error: function (error) {
            alert(error.status + "<--and--> " + error.statusText);
        }
    });
  });
}