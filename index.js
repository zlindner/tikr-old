'use strict'

$(document).ready(function() {
    /*
     * sidebar
     */

    $(document).on('click', '.sidebar>ul>li>a', function() {
        let id = $(this).attr('id');

        if (id) {
            $('.wrapper').hide();
            $('.wrapper-' + id).show();

            if (id == 'stocks') {
                $('.wrapper-search').show();
            }
        }
    });

    /*
     * login
     */

    $('.form-login input[name="login"]').click(function(e) {
        e.preventDefault();
        login();
    }); 

    $('.form-login input[name="create"]').click(function() {
        $('.form-login').hide();

        $('.form-create-account').trigger('reset');
        $('.form-error').hide();
        $('.form-create-account').show();
    });

    $('.form-login input[name="forgot"]').click(function() {
        $('.form-login').hide();

        $('.form-forgot-password').trigger('reset');
        $('.form-error').hide();
        $('.form-forgot-password').show();
    });

    $('.form-create-account input[name="create"]').click(function(e) {
        e.preventDefault();
        createAccount();
    });

    $('.form-create-account input[name="login"]').click(function() {
        $('.form-create-account').hide();

        $('.form-login').trigger('reset');
        $('.form-error').hide();
        $('.form-login').show();
    });

    $('.form-forgot-password input[name="reset"]').click(function(e) {
        e.preventDefault();
        forgotPassword();
    });

    $('.form-forgot-password input[name="login"]').click(function() {
        $('.form-forgot-password').hide();

        $('.form-login').trigger('reset');
        $('.form-error').hide();
        $('.form-login').show();
    });

    /*
     * stocks
     */

    jQuery.ui.autocomplete.prototype._resizeMenu = function() {
        var ul = this.menu.element;
        ul.outerWidth(this.element.outerWidth() - 1);
    }

    let chart = initChart();

    $('#stockInput').autocomplete({
        source: '/search',
        select: function(event, ui) {
            $('#stockInput').val('');

            loadStock(ui.item.value, chart);

            return false;
        },
        open: function(event, ui) {
            $('.wrapper-search>input[type="text"]').css('border-bottom', 'none');
            $('.wrapper-search>input[type="text"]').css('border-bottom-left-radius', '0');
            $('.wrapper-search>input[type="text"]').css('border-bottom-right-radius', '0');
        },
        close: function(event, ui) {
            $('.wrapper-search>input[type="text"]').css('border-bottom', '1px solid #dfdfdf');
            $('.wrapper-search>input[type="text"]').css('border-radius', '.125rem');
        },
        minLength: 1,
        position: {
            my: 'left+0 top-1'
        },
        messages: {
            noResults: '',
            results: function() {}
        }
    });
});

/*
 * login
 */ 

function login() {
    let email = $('.form-login input[name="email"]').val();
    let password = $('.form-login input[name="password"]').val(); 

    if (!validateEmail(email) || password.length == 0) {
        $('.form-error').text('Check your email and password and try again.');
        $('.form-error').show();
        return;
    }

    $.ajax({
        type: 'get',
        url: '/login',
        dataType: 'json',
        data: {
            email: email,
            password: password
        },
        success: function(data) {            
            if (data.status == 'fail') {
                $('.form-error').text('Check your email and password and try again.');
                $('.form-error').show();
                return;
            }
    
            $('.form-error').hide();

            console.log(data);

            // login
            window.location.replace('index.html');

            // TODO: if not verified add verification banner
        },
        fail: function(error) {
            console.log(error);
        }
    });
}

function createAccount() {
    let email = $('.form-create-account input[name="email"]').val();
    let password = $('.form-create-account input[name="password"]').val();
    let password2 = $('.form-create-account input[name="password2"]').val();

    if (!validateEmail(email) || password.length == 0 || password2.length == 0 || password != password2) {
        $('.form-error').text('Check your email and passwords and try again.');
        $('.form-error').show();
        return;
    }

    $('.form-error').hide();

    $.ajax({
        type: 'get',
        url: '/createAccount',
        dataType: 'json',
        data: {
            email: email,
            password: password
        },
        success: function(data) {

        },
        fail: function(error) {
            console.log(error);
        }
    });
}

function forgotPassword() {
    let email = $('.form-forgot-password input[name="email"]').val();

    if (!validateEmail(email)) {
        $('.form-error').text('Check your email and try again.');
        $('.form-error').show();
        return;
    }

    $('.form-error').hide();
}

function validateEmail(email) {
    let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

/*
 * stocks
 */ 

 // base IEX api url
const IEX = 'https://api.iextrading.com/1.0';

function loadStock(symbol, chart) {
    $.getJSON(IEX + '/stock/' + symbol + '/stats', function(stats) {
        $('#stockName').text(stats.companyName);
        $('#stockSymbol').text('(' + stats.symbol + ')');
    });

    $.getJSON(IEX + '/stock/' + symbol + '/previous', function(prev) {
        getPrice(symbol, prev, false);

        // update price every minute
        setInterval(function() {
            getPrice(symbol, prev, true)
        }, 60000);
    });

    loadChart(symbol, '1D', chart);
}

function getPrice(symbol, prev, update) {
    $.get(IEX + '/stock/' + symbol + '/price', function(price) {
        // dont animate on first call
        if (update) {
            let current = parseFloat($('#stockPrice').text()).toFixed(2);

            if (current != price.toFixed(2)) {
                $('#stockPrice').fadeOut(200);
                $('#stockPrice').fadeIn(400);
            }
        } 
        
        $('#stockPrice').text(price.toFixed(2));

        let diff = price - prev.close;
        let diffPercent = diff / prev.close * 100;

        if (diff > 0) {
            diff = '+' + diff.toFixed(2);
            diffPercent = '+' + diffPercent.toFixed(2);

            $('#priceDiff').css('color', '#19be87');
        } else if (diff < 0) {
            diff = '-' + diff.toFixed(2);
            diffPercent = '-' + diffPercent.toFixed(2);

            $('#priceDiff').css('color', '#f72121');
        }

        $('#priceDiff').text(diff + ' (' + diffPercent + '%)');
    });
}

function initChart() {
    let chart = new Chart($('#stockChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                fill: false,
                lineTension: 0,
                //TODO: borderColor: colour,
                borderWidth: 1.5,
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                //TODO: pointHoverBackgroundColor: colour,
                //TODO: pointHoverBorderColor: colour
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    display: false,
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        color: 'transparent'
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                displayColors: false
            },
            animation: false,
            maintainAspectRatio: false
        }
    });

    return chart;
}

function loadChart(symbol, period, chart) {
    $.getJSON(IEX + '/stock/' + symbol + '/chart/' + period, function(json) {
        let labels = [];
        let data = [];

        json.forEach(function(obj) {
            labels.push(obj.label);
            data.push(obj.open);
        });

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    });
}

 /*

// rgba colour representing positive
const POSITIVE = 'rgba(25, 190, 135, 255)';

// rgba colour representing negative
const NEGATIVE = 'rgba(247, 33, 33, 255)';

// rgba colour representing zero
const ZERO = 'rgba(34, 34, 34, 255)'

// js enum for determining months from index
const MONTHS = Object.freeze({
    0: 'Jan',
    1: 'Feb',
    2: 'Mar',
    3: 'Apr',
    4: 'May',
    5: 'Jun',
    6: 'Jul',
    7: 'Aug',
    8: 'Sep',
    9: 'Oct',
    10: 'Nov',
    11: 'Dec'
});

$(document).ready(function() {
    return;
    //let symbols = getSymbols();
    //let chart = initChart();

    //TODO: move getting symbols to server, might not have to limit results then
    $('#search').autocomplete({
        source: function (request, response) {
            var results = $.ui.autocomplete.filter(symbols, request.term);

            response(results.slice(0, 20));
        }, 
        minLength: 0,
        messages: {
            noResults: '',
            results: function() {}
        },
        select: function(event, ui) {
            let symbol = ui.item.value;

            getPrice(symbol);
            getChange(symbol);
            getStats(symbol);

            updateChart(chart, symbol, '1D');

            $(document).on('click', '.time-period-button:not(.selected)', function() {
                updateChart(chart, symbol, $(this).text());

                $('.time-period-button.selected').removeClass('selected');
                $(this).addClass('selected');
            });
        }
    });
});
}

//TODO: asynchronous
function getChartData(symbol, period) {
    const URL = IEX + '/stock/' + symbol + '/chart/' + period;

    let chartData = {
        labels: [],
        data: []
    };

    $.ajax({
        type: 'get',
        url: URL,
        dataType: 'json',
        async: false,
        success: function(json) {
            let labels = [];
            let data = [];

            //TODO: possibly add year for periods >= 1y
            json.forEach(function(obj) {
                let date = new Date(obj.date);
                let label = MONTHS[date.getMonth()] + ' ' + date.getDate();

                labels.push(label);
                data.push(obj.open);
            });

            chartData.labels = labels;
            chartData.data = data;
        },
        fail: function(error) {
            console.log(error);
        }
    });

    return chartData;
}

function updateChart(chart, symbol, period) {
    let chartData = getChartData(symbol, period);

    chart.data.labels = chartData.labels;
    chart.data.datasets[0].data = chartData.data;

    chart.options.tooltips.callbacks = {
        label: function(items, data) {
            return symbol + ': ' + items.yLabel;
        }
    }
    
    chart.update();
}
*/