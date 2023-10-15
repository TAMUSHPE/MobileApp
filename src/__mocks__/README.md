# \_\_mocks\_\_ directory

Some modules do not work in the jest testing environment. For example, `react-native-async-storage` only works in a `react-native` environment while jest uses `node`. This directory contains modules that mimick or "mock" their real counterparts. While the functionality isn't 1:1, it's enough that any module or app function that depends on these will be satisfied.