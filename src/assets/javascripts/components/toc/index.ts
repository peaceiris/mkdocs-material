/*
 * Copyright (c) 2016-2020 Martin Donath <martin.donath@squidfunk.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import {
  Observable,
  OperatorFunction,
  combineLatest,
  of,
  pipe
} from "rxjs"
import { map, shareReplay, switchMap } from "rxjs/operators"

import {
  AnchorList,
  Header,
  Main,
  Sidebar,
  Viewport,
  getElements,
  paintAnchorList,
  paintSidebar,
  watchAnchorList,
  watchSidebar
} from "observables"

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * Table of contents below tablet breakpoint
 */
export interface TableOfContentsBelowTablet {} // tslint:disable-line

/**
 * Table of contents above tablet breakpoint
 */
export interface TableOfContentsAboveTablet {
  sidebar: Sidebar                     /* Sidebar */
  anchors: AnchorList                  /* Anchor list */
}

/* ------------------------------------------------------------------------- */

/**
 * Table of contents
 */
export type TableOfContents =
  | TableOfContentsBelowTablet
  | TableOfContentsAboveTablet

/* ----------------------------------------------------------------------------
 * Helper types
 * ------------------------------------------------------------------------- */

/**
 * Mount options
 */
interface MountOptions {
  header$: Observable<Header>          /* Header observable */
  main$: Observable<Main>              /* Main area observable */
  viewport$: Observable<Viewport>      /* Viewport observable */
  tablet$: Observable<boolean>         /* Tablet media observable */
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Mount table of contents from source observable
 *
 * @param options - Options
 *
 * @return Operator function
 */
export function mountTableOfContents(
  { header$, main$, viewport$, tablet$}: MountOptions
): OperatorFunction<HTMLElement, TableOfContents> {
  return pipe(
    switchMap(el => tablet$
      .pipe(
        switchMap(tablet => {

          /* Mount table of contents above tablet breakpoint */
          if (tablet) {
            const els = getElements<HTMLAnchorElement>(".md-nav__link", el)

            /* Watch and paint sidebar */
            const sidebar$ = watchSidebar(el, { main$, viewport$ })
              .pipe(
                paintSidebar(el)
              )

            /* Watch and paint anchor list (scroll spy) */
            const anchors$ = watchAnchorList(els, { header$, viewport$ })
              .pipe(
                paintAnchorList(els)
              )

            /* Combine into a single hot observable */
            return combineLatest([sidebar$, anchors$])
              .pipe(
                map(([sidebar, anchors]) => ({ sidebar, anchors }))
              )

          /* Mount table of contents below tablet breakpoint */
          } else {
            return of({})
          }
        })
      )
    ),
    shareReplay(1)
  )
}