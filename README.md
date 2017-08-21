# Map View

This is a tiny all client side app which plots data on a map.

![Alt text](/screenshot_map_view.jpg?raw=true "Screenshot Showing Sample Output")

## Why

I needed to plot and switch between a lot of datasets in a live setting.
Mostly to show relative proportions of "stuff".
This was a really simple and fun way to do it.

## Use

Replace <GOOGLE_API_KEY> in index.html with Your [google api key](https://developers.google.com/maps/documentation/javascript/get-api-key).

It's a static site and can be hosted anywhere You like, including S3.

For example to run it locally: you can use the wonderfully simple node [http-server](https://www.npmjs.com/package/http-server) package.

```
npm install http-server -g
cd <app directory>
http-server
```


## Instructions

Format the file as specified on the main page of the application:

```
"name","latitude","longitude","Value1","Value2"
"Hamilton","-37.7870","175.2793","100","880"
```

Then drag-drop the file onto the application window in the browser.
