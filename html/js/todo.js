
document.ontouchmove = function(e){ e.preventDefault(); }

var items = [];
var saveon = false;
var swipeon = false;

$(function(){

  items = loaditems();
  for( var i = 0; i < items.length; i++ ) {
    additem(items[i]);
  }

  $('#add').tap(function(){
    $('#add').hide();
    $('#cancel').show();
    $('#newitem').slideDown();
    saveon = false;
    activatesave();
  });

  $('#cancel').tap(function(){
    $('#add').show();
    $('#cancel').hide();
    $('#newitem').slideUp();
    $('div.delete').hide();
    swipeon = false;
  });

  $('#text').keyup(function(){
    activatesave();
  });

  $('#save').tap(function(){
    var text = $('#text').val();
    if( 0 == text.length ) {
      return;
    }
    $('#text').val('');

    var id = new Date().getTime();
    var itemdata = {id:id,text:text,done:false}; 
    items.push(itemdata);
    additem(itemdata);

    $('#newitem').slideUp();
    $('#add').show();
    $('#cancel').hide();

    saveitems(items);
  });

});

function activatesave() {
  var textlen = $('#text').val().length;
  if( !saveon && 0 < textlen ) {
    $('#save').css('opacity',1);
    saveon = true;
  }
  else if( 0 == textlen ) {
    $('#save').css('opacity',0.3);
    saveon = false;
  }
}


function additem(itemdata) {
  var item = $('#item_tm').clone();
  item.attr({id:itemdata.id});
  item.find('span.text').text(itemdata.text);

  var delbutton = $('#delete_tm').clone().hide();
  item.append(delbutton);

  delbutton.attr('id','delete_'+itemdata.id).tap(function(){
    for( var i = 0; i < items.length; i++ ) {
      if( itemdata.id == items[i].id ) {
        items.splice(i,1);
      }
    }
    item.remove();
    $('#add').show();
    $('#cancel').hide();
    saveitems(items);
    return false;
  });

  markitem(item,itemdata.done);
  item.data('itemdata',itemdata);

  item.tap(function(){
    if( !swipeon ) {
      var itemdata = item.data('itemdata');
      markitem(item,itemdata.done = !itemdata.done);
    }
  });

  item.swipe(function(){
    var itemdata = item.data('itemdata');
    if( !swipeon ) {
      markitem(item,itemdata.done = !itemdata.done);

      $('#delete_'+itemdata.id).show();
      $('#add').hide();
      $('#cancel').show();
      swipeon = true;
    }
    else {
      $('#add').show();
      $('#cancel').hide();
      $('div.delete').hide();
      swipeon = false;
    }
  });

  $('#todolist').append(item).listview('refresh');
}

function markitem( item, done ) {
  item.find('span.check').html( done ? '&#10003;' : '&nbsp;' );
  item.find('span.text').css({'text-decoration': done ? 'line-through' : 'none' });
  saveitems(items);
}


function saveitems(items) {
  localStorage.items = JSON.stringify(items);
}

function loaditems() {
  return JSON.parse(localStorage.items || '[]');
}

