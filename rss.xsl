<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            font-size: 14px;
            color: #0c1824;
            background: #f1f4f7;
            line-height: 1.666666;
            padding: 15px;
          }
          .notice {
            font-size: 10px;
            color: #545d67;
            max-width: 800px;
            margin: 0 auto 15px auto;
          }
          a, a:link, a:visited {
            color: #003e82;
            text-decoration: none;
          }
          a:hover {
            color: #003e82;
            text-decoration: underline;
          }
          h1 {
            line-height: 1.25em;
          }
          h1, h2, h3, p {
            margin-top: 0;
            margin-bottom: 15px;
          }
          h2 {
            line-height: 1.25em;
            margin-bottom: 5px;
          }
          h3 {
            font-style: italic;
          }
          .container {
            max-width: 860px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 4px;
          }
          .podcast-image {
            flex-shrink: 0;
            width: 160px;
            height: 160px;
            margin-left: 20px;
          }
          .podcast-image img {
            width: 160px;
            height: auto;
            border-radius: 4px;
          }
          .podcast-header {
            display: flex;
            padding-bottom: 20px;
          }
          .podcast-header hgroup {
            flex-grow: 1;
          }
          .item {
            display: flex;
            flex-wrap: wrap;
            border-top: 1px solid #e0e4e8;
            padding: 20px 0;
          }
          .item h2 {
            width: 100%;
            flex-shrink: 0;
          }
          .item p {
            width: 100%;
            flex-shrink: 0;
          }
          .item p:empty, .item p + br {
            display: none;
          }
          .item ol, .item ul {
            width: 100%;
            flex-shrink: 0;
          }
          .item .description {
            margin-bottom: 1em;
            overflow-y: auto;
            overscroll-behavior: contain;
            word-break: break-word;
            overflow-wrap: break-word;
            word-wrap: break-word;
            max-height: 150px;
          }
          .audio-container {
            width: 100%;
            flex-shrink: 0;
          }
          audio {
            width: 100%;
            border-radius: 4px;
          }
          audio:focus {
            outline: none;
          }
          .episode-time {
            width: 100%;
            flex-shrink: 0;
            font-size: 12px;
            color: #545d67;
            margin-bottom: 1em;
          }
          @media only screen and (max-device-width: 768px) {
            .audio-container {
              min-height: 120px;
            }
          }
        </style>
      </head>
      <body>
        <div class="notice">
          This is a podcast RSS Feed for <xsl:value-of select="/rss/channel/title"/>. 
          It is meant for use by podcast apps using the URL in the address bar.
        </div>
        <div class="container">
          <div class="podcast-header">
            <hgroup>
              <h1>
                <xsl:value-of select="/rss/channel/title"/>
              </h1>
              <p>
                <xsl:value-of select="/rss/channel/description"/>
              </p>
              <xsl:if test="/rss/channel/link">
              <p>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/link"/>
                  </xsl:attribute>
                  <xsl:attribute name="target">_blank</xsl:attribute>
                  Visit podcast website &#x2192;
                </a>
              </p>
              </xsl:if>
            </hgroup>
            <xsl:if test="/rss/channel/image">
              <div class="podcast-image">
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/image/link"/>
                  </xsl:attribute>
                  <img>
                    <xsl:attribute name="src">
                      <xsl:value-of select="/rss/channel/image/url"/>
                    </xsl:attribute>
                    <xsl:attribute name="title">
                      <xsl:value-of select="/rss/channel/image/title"/>
                    </xsl:attribute>
                  </img>
                </a>
              </div>
            </xsl:if>
          </div>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <h2>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <xsl:attribute name="target">_blank</xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <div class="episode-time">
                <span><xsl:value-of select="pubDate" /></span> &#x02022;
                <span><xsl:value-of select="format-number(floor(itunes:duration div 60), '0')" /> minutes</span>
              </div>
              <xsl:choose>
              <xsl:when test="itunes:summary">
                <p>
                  <xsl:value-of select="itunes:summary" disable-output-escaping="yes"/>
                </p>
              </xsl:when>
              <xsl:when test="description">
                <div class="description">
                  <xsl:value-of select="description" disable-output-escaping="yes"/>
                </div>
              </xsl:when>
              <xsl:otherwise>
              </xsl:otherwise>
            </xsl:choose>
            <div class="audio-container">
              <audio controls="true" preload="none">
                <xsl:attribute name="src">
                <xsl:value-of select="enclosure/@url"/>
                </xsl:attribute>
              </audio>
            </div>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet> 