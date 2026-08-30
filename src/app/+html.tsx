import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#12100D" />
        <meta name="description" content="The Last Alibi — compact deduction mysteries, playable offline." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/last-alibi-mark.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'html,body,#root{height:100%;background:#12100D}body{overscroll-behavior-y:none}*{box-sizing:border-box}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
