-module(zein_ffi).
-export([run_js/1]).

run_js(JS) when is_binary(JS) ->
    Path = <<"/tmp/zein_run.mjs">>,
    file:write_file(Path, JS),
    CmdList = binary_to_list(<<"node ", Path/binary>>),
    Result = os:cmd(CmdList),
    io:put_chars(Result).
