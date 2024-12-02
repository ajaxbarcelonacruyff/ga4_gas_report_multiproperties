# ga4_gas_report_multiproperties
複数のGA4プロパティのレポートデータをGoogleSheetsにインポート

Google Analyticsのユニバーサルアナリティクス時代はビューがあったのですが、GA4にはビューが無いので、とある海外向けサイトでディレクトリごとに言語を分けているのですが、各ディレクトリのGA計測をビューの代わりにプロパティを分けて計測しています。

データポータルでダッシュボードを作成しているのですが、複数のGA4プロパティのレポートデータを1つにまとめる必要があったので、Google Apps Scriptで全GA4プロパティのレポートデータを取得して、Google Sheetsにまとめるスクリプトを作成しました。

最初に[Analytics Data APIサービス](https://developers.google.com/apps-script/advanced/analyticsdata)を追加する必要がありますが、今回は省略します。

Googleシート＞拡張＞App ScriptでGoogle Apps Scriptを開いてプログラムをコピペしてください。

## データ取得部分

細かいことは省略しますが、下記の指定が可能です。

1. プロパティ
2. 期間指定
3. ディメンション
4. 指標
5. ソート（今回は日付固定）
6. フィルター（今回はすべてAND条件）

## 呼び出し部分

main関数が上記の関数を呼び出す関数になります。ここで期間やディメンションなどを指定します。

なお、フィルターの条件のタイプについては[FilterExpression MatchType](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/FilterExpression#MatchType)を参考にしてください。
また、ディメンションと指標はGA4 [API Dimensions & Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)に一覧があります。
