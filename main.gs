/*
* 複数のGA4プロパティのレポートデータをGoogleSheetsにインポート
* Google Analyticsのユニバーサルアナリティクス時代はビューがあったのですが、GA4にはビューが無いので、とある海外向けサイトでディレクトリごとに言語を分けているのですが、各ディレクトリのGA計測をビューの代わりにプロパティを分けて計測しています。
* データポータルでダッシュボードを作成しているのですが、複数のGA4プロパティのレポートデータを1つにまとめる必要があったので、Google Apps Scriptで全GA4プロパティのレポートデータを取得して、Google Sheetsにまとめるスクリプトを作成しました。
* 最初にAnalytics Data API サービスを追加する必要がありますが、今回は省略します。
*/
/*
* データ取得部分（下記の指定が可能）
* プロパティ
* 期間指定
* ディメンション
* 指標
* ソート（今回は日付固定）
* フィルター（今回はすべてAND条件）
*/
function runReport(sheetName, dimensionArr, metricArr, startDate, endDate, filters){
  let properties = [{propertyId: "property1", propertyName:'12345678'},{propertyId: "property2", propertyName:'1111111'}];
  for(let i = 0; i < properties.length; i++){
    let propertyId = properties[i].propertyId;
    let propertyName = properties[i].propertyName;
    try {

      let request = AnalyticsData.newRunReportRequest();

      // Date
      let dateRange = AnalyticsData.newDateRange();
      dateRange.startDate = startDate; // yyyy-MM-dd
      dateRange.endDate = endDate; // yyyy-MM-dd
      request.dateRanges = dateRange;

      // Metric
      metrics =[];
      for(var x = 0; x < metricArr.length; x++){
        let metricx = AnalyticsData.newMetric();
        metricx.name = metricArr[x];
        metrics.push(metricx);
      }
      request.metrics =metrics;

      // Dimension
      dimensions =[];
      for(var x = 0; x < dimensionArr.length; x++){
        let dimensionx = AnalyticsData.newDimension();
        dimensionx.name = dimensionArr[x];
        dimensions.push(dimensionx);
      }
      request.dimensions = dimensions;

      // OrderBy = Date
      let dimensionOrderBy = AnalyticsData.newDimensionOrderBy();
      dimensionOrderBy.dimensionName = 'date';
      let orderby = AnalyticsData.newOrderBy();
      orderby.dimension = dimensionOrderBy;
      orderby.desc = false;
      request.orderBys = [orderby];

      // Filter
      if(filters){
        let dimensionfilter = AnalyticsData.newFilterExpression();
        dimensionfilter.andGroup =  AnalyticsData.newFilterExpressionList();
        dimensionfilter.andGroup.expressions = [];

        for(var x = 0; x < filters.length; x++){
          for(var j = 0; j < filters[x].conditions.length; j++){      
            let filterExpression = AnalyticsData.newFilterExpression();
            filterExpression.filter = AnalyticsData.newFilter();
            filterExpression.filter.fieldName = filters[x].fieldName;
            filterExpression.filter.stringFilter = AnalyticsData.newStringFilter();
            filterExpression.filter.stringFilter.value = filters[x].conditions[j];
            filterExpression.filter.stringFilter.matchType = filters[x].matchType;
            dimensionfilter.andGroup.expressions.push(filterExpression)
          }
        }
        request.dimensionFilter = dimensionfilter;
      }

      let report = AnalyticsData.Properties.runReport(request,'properties/' + propertyId);
      if (!report.rows) {
        Logger.log(propertyName + '\tNo rows returned.');
        continue;
      }

      let spreadsheet = SpreadsheetApp.create('Google Analytics Report');
      let sheet = SPREADSHEET.getSheetByName(sheetName);

      // Append the headers.
      let dimensionHeaders = report.dimensionHeaders.map(
          (dimensionHeader) => {
            return dimensionHeader.name;
          });
      let metricHeaders = report.metricHeaders.map(
          (metricHeader) => {
            return metricHeader.name;
          });

      let headers = [...['datasource'],...dimensionHeaders, ...metricHeaders];
      let sr = sheet.getLastRow();
      if(sr >= 1){
      }else{
        sheet.appendRow(headers);
      }
      sr = sheet.getLastRow() +1;

      // Append the results.
      let rows = report.rows.map((row) => {
        let dimensionValues = row.dimensionValues.map(
            (dimensionValue) => {
              return dimensionValue.value;
            });
        let metricValues = row.metricValues.map(
            (metricValues) => {
              return metricValues.value;
            });
        return [...[propertyName],...dimensionValues, ...metricValues];
      });
      sheet.getRange(sr, STARTCOLUMN, report.rows.length.setValues(rows);

      Logger.log('%s:\tReport spreadsheet created: %s',propertyName, spreadsheet.getUrl());

    } catch (e) {
      Logger.log('Failed with error: %s', e);
    }
  }

}

/* 
* 呼び出し部分
* main関数が上記の関数を呼び出す関数になります。ここで期間やディメンションなどを指定します。
*/
function main(){
  let dimensions =[], metrics = [], filters =[];
  let startDate = "2022-09-01";
  let endDate = "2022-09-01";

   // eventName = "search", page_type(custom event) = "homepage"
  dimensions =['date','eventName','customEvent:page_type'];
  metrics =['activeUsers','totalUsers','sessions','eventCount'];
  filters = [{'fieldName': 'eventName', 'conditions': ['search']},{'fieldName': 'customEvent:page_type', 'conditions': ['homepage']}];
  runReport("Sheet01",dimensions, metrics, startDate, endDate, filters);

   // eventName = "page_view", pageLocation = "special-offer/thank-you"
  dimensions =['date','eventName','pageLocation'];
  metrics =['activeUsers','totalUsers','sessions','eventCount'];
  filters = [{'fieldName': 'eventName', 'conditions': ['page_view'],'matchType':'EXACT'},{'fieldName': 'pageLocation', 'conditions': ['/special-offer/thank-you'],'matchType':'CONTAINS'}];
  runReport("Sheet02",dimensions, metrics, startDate, endDate, filters);
}
