import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import {
  SortTreeNode,
  topologicalGroupedSort,
} from '@next-ssp/grouped-topsort';

interface IServerSideUnitResult<P, PL> {
  payload?: PL;
  props?: GetServerSidePropsResult<P>;
}

type ServerSideUnitResult<U extends ServerSideUnit<any>> =
  U extends ServerSideUnit<(...args: any[]) => Promise<infer R>> ? R : never;

export class ServerSideUnit<
  F extends (...args: any[]) => Promise<IServerSideUnitResult<any, any>>
> extends SortTreeNode<F, ServerSideUnit<any>> {
  private constructor(fn, deps) {
    super(fn, deps);
  }

  static createServerSideUnit<
    F extends (
      ctx: GetServerSidePropsContext
    ) => Promise<IServerSideUnitResult<any, any>>
  >(deps: null, fn: F): ServerSideUnit<F>;
  static createServerSideUnit<
    U0 extends ServerSideUnit<any>,
    F extends (
      ctx: GetServerSidePropsContext,
      u0: ServerSideUnitResult<U0>
    ) => Promise<IServerSideUnitResult<any, any>>
  >(deps: [U0], fn: F): ServerSideUnit<F>;
  static createServerSideUnit<
    U0 extends ServerSideUnit<any>,
    U1 extends ServerSideUnit<any>,
    F extends (
      ctx: GetServerSidePropsContext,
      u0: ServerSideUnitResult<U0>,
      u1: ServerSideUnitResult<U1>
    ) => Promise<IServerSideUnitResult<any, any>>
  >(deps: [U0, U1], fn: F): ServerSideUnit<F>;
  static createServerSideUnit(
    deps: ServerSideUnit<any>[],
    fn: (...args: any[]) => Promise<IServerSideUnitResult<any, any>>
  ) {
    return new ServerSideUnit(fn, deps);
  }
}

export class ServerSideTree {
  readonly groups: ServerSideUnit<any>[][];

  constructor(private units: ServerSideUnit<any>[]) {
    this.groups = topologicalGroupedSort(units);
    this.run.bind(this);
  }

  async run(
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<any>> {
    const results = new WeakMap<
      ServerSideUnit<any>,
      IServerSideUnitResult<any, any>
    >();

    for (let group of this.groups) {
      await Promise.all(
        group.map(unit => {
          return unit
            .value(ctx, ...unit.deps.map(dep => results.get(dep)))
            .then(result => {
              results.set(unit, result);
              return result;
            });
        })
      );
    }

    const pageProps: GetServerSidePropsResult<any> = { props: {} };

    for (let unit of this.units) {
      const { props } = results.get(unit);
      if ('redirect' in props) return { redirect: props.redirect };
      if ('notFound' in props) return { notFound: props.notFound };
      Object.assign(pageProps.props, props.props);
    }

    return pageProps;
  }
}

// const a = ServerSideUnit.createServerSideUnit(null, async function () {
//   return { payload: { some: 'a' } };
// });
//
// const u = ServerSideUnit.createServerSideUnit([a], async function (ctx, a) {
//   return {};
// });
