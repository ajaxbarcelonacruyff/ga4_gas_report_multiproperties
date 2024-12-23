
# Consolidating GA4 Reports with Google Apps Script

In the Universal Analytics era, views were available in Google Analytics. However, since GA4 does not have views, we are using separate properties to track each directory for a multilingual site targeting overseas users.

We needed to consolidate reports from multiple GA4 properties into one for our dashboard in Data Studio. To achieve this, we created a script in Google Apps Script to fetch report data from all GA4 properties and summarize it in Google Sheets.

## Prerequisite: Adding the Analytics Data API

Before proceeding, you need to add the [Analytics Data API service](https://developers.google.com/apps-script/advanced/analyticsdata). For details on how to add this, refer to the [previous article](https://github.com/ajaxbarcelonacruyff/ga4_create_multi_properties).

## Data Retrieval Section

Here are the customizable options for the script:

1. Property
2. Date range
3. Dimensions
4. Metrics
5. Sorting (fixed to date for this example)
6. Filters (all conditions are combined with AND in this example)

```javascript
function runReport(sheetName, dimensionArr, metricArr, startDate, endDate, filters) {
  let properties = [{propertyId: "property1", propertyName:'12345678'}, {propertyId: "property2", propertyName:'1111111'}];
  for (let i = 0; i < properties.length; i++) {
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
      let metrics = metricArr.map(metricName => {
        let metric = AnalyticsData.newMetric();
        metric.name = metricName;
        return metric;
      });
      request.metrics = metrics;

      // Dimension
      let dimensions = dimensionArr.map(dimensionName => {
        let dimension = AnalyticsData.newDimension();
        dimension.name = dimensionName;
        return dimension;
      });
      request.dimensions = dimensions;

      // OrderBy = Date
      let dimensionOrderBy = AnalyticsData.newDimensionOrderBy();
      dimensionOrderBy.dimensionName = 'date';
      let orderby = AnalyticsData.newOrderBy();
      orderby.dimension = dimensionOrderBy;
      orderby.desc = false;
      request.orderBys = [orderby];

      // Filter
      if (filters) {
        let dimensionFilter = AnalyticsData.newFilterExpression();
        dimensionFilter.andGroup = AnalyticsData.newFilterExpressionList();
        dimensionFilter.andGroup.expressions = [];

        filters.forEach(filter => {
          filter.conditions.forEach(condition => {
            let filterExpression = AnalyticsData.newFilterExpression();
            filterExpression.filter = AnalyticsData.newFilter();
            filterExpression.filter.fieldName = filter.fieldName;
            filterExpression.filter.stringFilter = AnalyticsData.newStringFilter();
            filterExpression.filter.stringFilter.value = condition;
            filterExpression.filter.stringFilter.matchType = filter.matchType;
            dimensionFilter.andGroup.expressions.push(filterExpression);
          });
        });
        request.dimensionFilter = dimensionFilter;
      }

      let report = AnalyticsData.Properties.runReport(request, 'properties/' + propertyId);
      if (!report.rows) {
        Logger.log(propertyName + '\tNo rows returned.');
        continue;
      }

      let spreadsheet = SpreadsheetApp.create('Google Analytics Report');
      let sheet = spreadsheet.getSheetByName(sheetName);

      // Append headers
      let dimensionHeaders = report.dimensionHeaders.map(header => header.name);
      let metricHeaders = report.metricHeaders.map(header => header.name);
      let headers = ['datasource', ...dimensionHeaders, ...metricHeaders];

      if (sheet.getLastRow() < 1) {
        sheet.appendRow(headers);
      }

      // Append results
      let rows = report.rows.map(row => {
        let dimensionValues = row.dimensionValues.map(value => value.value);
        let metricValues = row.metricValues.map(value => value.value);
        return [propertyName, ...dimensionValues, ...metricValues];
      });
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

      Logger.log('%s:\tReport spreadsheet created: %s', propertyName, spreadsheet.getUrl());
    } catch (e) {
      Logger.log('Failed with error: %s', e);
    }
  }
}
```

## Main Function

The `main` function calls the `runReport` function to specify dimensions, metrics, and date ranges.

```javascript
function main() {
  let dimensions = [], metrics = [], filters = [];
  let startDate = "2022-09-01";
  let endDate = "2022-09-01";

  // Example 1: eventName = "search", page_type(custom event) = "homepage"
  dimensions = ['date', 'eventName', 'customEvent:page_type'];
  metrics = ['activeUsers', 'totalUsers', 'sessions', 'eventCount'];
  filters = [
    {'fieldName': 'eventName', 'conditions': ['search']},
    {'fieldName': 'customEvent:page_type', 'conditions': ['homepage']}
  ];
  runReport("Sheet01", dimensions, metrics, startDate, endDate, filters);

  // Example 2: eventName = "page_view", pageLocation = "special-offer/thank-you"
  dimensions = ['date', 'eventName', 'pageLocation'];
  metrics = ['activeUsers', 'totalUsers', 'sessions', 'eventCount'];
  filters = [
    {'fieldName': 'eventName', 'conditions': ['page_view'], 'matchType': 'EXACT'},
    {'fieldName': 'pageLocation', 'conditions': ['/special-offer/thank-you'], 'matchType': 'CONTAINS'}
  ];
  runReport("Sheet02", dimensions, metrics, startDate, endDate, filters);
}
```

Refer to [FilterExpression MatchType](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/FilterExpression#MatchType) for filter condition types. For available dimensions and metrics, check the GA4 [API Dimensions & Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema).
