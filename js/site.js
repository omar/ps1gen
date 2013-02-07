  $(document).ready(function() {
    setCursorBlink();
    populateItems();

    $( "#sortable" ).sortable({
      revert: true,
      stop: function () {
       updateOutput();
      }
    });
    $( ".category li" ).draggable({
      connectToSortable: "#sortable",
      helper: "clone",
      revert: "invalid",
      cursorAt: { left: 0 },
      stop: function() {
        bindClicks();
        bindTextChange();
        updateOutput();
        $('.pop-it').popover(popoverOptions);
      }
    });
    $( "ul, li" ).disableSelection();

    var popoverOptions = {
      placement: 'bottom'
    };

    $('.pop-it').popover(popoverOptions);

    $('.color-picker-add').replaceWith(colorsDropdown);
    bindClicks();
  });

  _.templateSettings = {
    evaluate : /\{\[([\s\S]+?)\]\}/g,
    interpolate : /\{\{(.+?)\}\}/g
  };

  var symbolsTable = [
    ['\\u', 'Username of current user', 'omar', 'computer'],
    ['\\h', 'Hostname, up to the first \'.\'', 'mybox', 'computer'],
    ['\\H', 'Hostname', 'mybox.local', 'computer'],

    ['\\d', 'Date in "Weekday Month Date" format', 'Tue May 26', 'date'],
    ['\\t', 'Time in 24-hour HH:MM:SS format', '23:01:01', 'time'],
    ['\\T', 'Time in 12-hour HH:MM:SS format', '11:01:01', 'time'],
    ['\\@', 'Time in 12-hour format with am/pm', '11:01:01 AM', 'time'],

    ['\\w', 'Current working directory, with $HOME abbreviated with a tilde (uses the $PROMPT_DIRTRIM variable)', '~/ps1gen', 'directory'],
    ['\\W', 'Basename of the current working directory ', 'ps1gen', 'directory'],

    ['\\#', 'Command number (this will count up at each prompt, as long as you type something)', '5', 'other']
  ];

  var symbols = (function() {
    var items = [];

    for(var i in symbolsTable) {
      var symbol = symbolsTable[i];
      var text = symbol[0];
      var description = symbol[1].replace(/"/g, "'");
      var example = symbol[2];
      var category = symbol[3];

      var item = {
        text: text,
        description: description,
        example: example,
        category: category
      };

      items.push(item);
    }

    return items;
  })();

  var colorsTable = [
    ['Gray', '37m', '#c4c5c6'],
    ['Black', '30m', '#000'],
    ['Red', '31m', '#ba2f1e'],
    ['Green', '32m', '#22b421'],
    ['Yellow', '33m', '#a4a423'],
    ['Blue' , '34m', '#3f2add'],
    ['Pink' , '35m', '#cd31cd'],
    ['Cyan', '36m', '#2db2c1']
  ];

  var colors = (function() {
    var items = [];

    for(var i in colorsTable) {
      var color = colorsTable[i];
      var text = color[0];
      var code = color[1];
      var hex = color[2];

      var item = {
        text: text,
        code: code,
        hex: hex
      };

      items.push(item);
    }

    return items;
  })();

  var colorsDropdown = (function() {
    var template = _.template($('#color-template').html());
    var html = template({ colors: colors });
    return html;
  })();

  var populateItems = function() {
    var template = _.template($('#item-template').html());

    var html = [];
    for(var i in symbols) {
      var symbol = symbols[i];
      
      if(html[symbol.category] === undefined)
        html[symbol.category] = '';

      html[symbol.category] += template(symbols[i]);
    }

    for(var i in html) {
      $('#' + i).prepend(html[i]);
    }
  };

  var bindClicks = function() {
    $('a.color-pick').off('click').on('click', function (e) {
      var $this = $(this);
      var color = $this.find('.color-preview').css('background-color');
      var code = $this.find('.color-preview').attr('data-color-code');

      $this.parents('.new-item').find('.example, .example input').css('color', color);
      $this.parents('.btn-group').find('.dropdown-toggle .color-preview').css('background-color', color);
      $this.parents('.btn-group').find('.dropdown-toggle .color-preview').attr('data-color-code', code);
      $this.parents('ul').find('li').removeClass('active');
      $this.parent('li').addClass('active');

      updateOutput();
      e.preventDefault(); 
      return true;
    });

    $('a.pop-it').off('click').on('click', function (e) {
      e.preventDefault(); 
      return true;
    });

    $('.delete').off('click').on('click', function (e) {
      $(this).parent('li').remove();
      updateOutput();
      e.preventDefault(); 
      return true;
    });

    $('#preview-background a').off('click').on('click', function (e) {
       $('#preview-background a').removeClass('active');
       var $this = $(this);
       $this.toggleClass('active');
       $('#preview').css('background-color', $this.data('color'));
       e.preventDefault(); 
       return true;
    });

    $('.trailing-whitespace').off('click').on('click', function (e) {
      $(this).toggleClass('active');
      updateOutput();
      e.preventDefault(); 
      return true;
    });
  };

  var bindTextChange = function() {
    $('#selected .example input').on('keyup', function() {
      updateOutput();
    });
  };

  var parseSelectedItems = function() {
    var items = [];

    var text = '';
    var preview = '';
    var $selected = $('#sortable li.new-item:not(.ui-sortable-placeholder)');
    if($selected.size() == 0)
      return {
        text: '',
        preview: '',
        items: []
      };

    $selected.each(function (index) {
      var $this = $(this);

      var colorCode = $this.find('.dropdown-toggle .color-preview').attr('data-color-code');
      var symbol = $this.find('.pop-it').text();
      var whitespace = $this.find('.trailing-whitespace').is('.active');
      
      var $clone = $this.find('.example').clone().attr('class', 'preview-example');

      if(symbol === 'txt') {
        symbol = $this.find('input').val();
        symbol = symbol.replace(/"/g, '\\"')
                       .replace(/\\/g, '\\\\');
        $clone.html($clone.find('input').val());
      }
        
      text += '\\e[0;' + colorCode + symbol;

      if(whitespace) {
        text += ' ';  
        $clone.append('&nbsp;');
      } 

      preview += $clone[0].outerHTML;    
      
      var item = {
        colorCode: colorCode,
        symbol: symbol
      };
      items.push(item);
    });

    text += '\\e[0m';

    var result = {
      text: text,
      preview: preview,
      items: items
    };

    return result;
  };

  var updateOutput = function() {
    var result = parseSelectedItems();
    
    var text = 'export PS1="' + result.text + '"';
    $('#output').html(text);

    $('#preview-text').html(result.preview);
  };

  var setCursorBlink = function() {
    var func = function () {
      $('#cursor').toggle();
    };

    var interval = 500;

    setInterval(func, interval);
  };