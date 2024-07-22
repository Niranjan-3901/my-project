import axios from "axios";
import React, {
    useEffect,
    useState
} from "react";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Container,
    Grid,
    Stack,
    TextField,
    Pagination
} from "@mui/material";
import {
    GoSortAsc,
    GoSortDesc
} from "react-icons/go";
import ProductCard from "./ProductCard";

function ProductListNew() {
    const axiosClientBytexl = axios.create({
        baseURL: "https://json-server-c67opnddza-el.a.run.app",
    });

    const [productList, setProductsList] = useState([]);
    const [categoryList, setCategoryList] = useState(["All"]);
    const [categorySelect, setCategorySelect] = useState("");
    const [companyList, setCompanyList] = useState(["All"]);
    const [companySelect, setCompanySelect] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [sortBasis, setSortBasis] = useState("Ascending");
    const [availability, setAvailability] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [rating, setRating] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    let query = `?availability=${availability}&minPrice=${minPrice || 0
        }&maxPrice=${maxPrice || 5000}`;

    useEffect(() => {
        axiosClientBytexl
            .get("/companies")
            .then((response) => {
                setCompanyList(
                    response.data.map((item) => ({
                        desc: item.description,
                        name: item.name,
                    }))
                );
            })
            .catch((err) => console.error(err));

        axiosClientBytexl
            .get("/categories")
            .then((response) => {
                setCategoryList(
                    response.data.map((item) => {
                        return item.name
                    }
                    ));
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (
            categorySelect &&
            companySelect &&
            categorySelect !== "All" &&
            companySelect.substring(0, 3) !== "All"
        ) {
            axiosClientBytexl
                .get(
                    `/companies/${companySelect.substring(
                        0, 3
                    )}/categories/${categorySelect}/products` + query
                )
                .then((response) => {
                    setProductsList(SortingFunction(response.data));
                })
                .catch((err) => console.error(err));
        }

        else if (categorySelect && categorySelect !== "All") {
            axiosClientBytexl
                .get(`/categories/${categorySelect}/products` + query)
                .then((response) => {
                    setProductsList(SortingFunction(response.data));
                })
                .catch((err) => console.error(err));
        }

        else if (companySelect && companySelect.substring(0, 3) !== "All") {
            axiosClientBytexl
                .get(`/companies/${companySelect.substring(0, 3)}/products` + query)
                .then((response) => {
                    setProductsList(SortingFunction(response.data));
                })
                .catch((err) => console.error(err));
        }

        else {
            axiosClientBytexl
                .get("/products")
                .then((response) => {
                    if (availability && availability !== "All") {
                        setProductsList(SortingFunction(response.data.filter((product) => {
                            return product.availability === availability
                        }
                        )));
                    }
                    else {
                        setProductsList(SortingFunction(response.data));
                    }
                })
                .catch((err) => console.error(err));
        }
        setCurrentPage(1)
    }, [
        categorySelect,
        companySelect,
        availability,
        minPrice,
        maxPrice,
    ]);

    useEffect(() => {
        setProductsList(SortingFunction(productList));
    }, [sortOption, sortBasis, rating]);

    const SortingFunction = (data) => {
        let sortedList = [...data];

        if (rating) {
            sortedList = sortedList.filter((item) => {
                return item.rating >= rating;
            })
        }

        if (sortOption) {
            sortedList.sort((a, b) => {
                if (sortOption.toLowerCase() === "price") {
                    return a.price - b.price;
                } else if (sortOption.toLowerCase() === "rating") {
                    return b.rating - a.rating;
                } else if (sortOption.toLowerCase() === "discount") {
                    return b.discount - a.discount;
                } else if (sortOption.toLowerCase() === "name") {
                    return a.productName.localeCompare(b.productName);
                }
                return 0;
            });
            if (sortBasis === "Descending") sortedList.reverse();
        }
        return sortedList
    }

    const handleResetButtonClick = () => {
        setCategorySelect("All");
        setCompanySelect("All");
        setSortOption("All");
        setSortBasis("Ascending");
        setAvailability("All");
        setMinPrice("");
        setMaxPrice("");
    };

    const isFilteredApplied = () => {
        return (
            categorySelect !== "All" ||
            companySelect !== "All" ||
            availability !== "All"
        );
    };

    const showData = () => {
        if (!isFilteredApplied() && productList.length === 0) {
            return (
                <Stack
                    alignItems={"center"}
                    justifyItems={"center"}
                    mt={10}
                    width={"100%"}
                >
                    <h2>Loading Data...</h2>
                    <CircularProgress color="secondary" />
                </Stack>
            );
        } else if (isFilteredApplied() && productList.length === 0) {
            return (
                <Box sx={{ alignItems: "center" }}>
                    <h1>No Data Found...</h1>
                    <h4>Please try to change your filters.</h4>
                </Box>
            );
        } else {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = productList.slice(startIndex, endIndex);


            return paginatedData.map((product) => (
                <Grid
                    item
                    key={product.id}
                    md={4}
                    sm={6}
                    xs={12}
                    >
                    <ProductCard product={product} />
                </Grid>
            ));
        }
    };

    const handlePageChange = (_, value) => {
        setCurrentPage(value);
    };

    return (
        <Container>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    height: "fit-content",
                    justifyContent: "space-between",
                }}
            >
                <h1>All Products</h1>
                <Button
                    onClick={handleResetButtonClick}
                    variant="outlined"
                >
                    Clear Filters
                </Button>
            </Box>
            <Grid
                container
                spacing={2}
                sx={{ paddingLeft: "0px" }}
                width={"100%"}
            >
                <Grid item xs={12}
                    padding={"5px"}
                >
                    <Box
                        display={"flex"}
                        flex={1}
                        flexWrap={"wrap"}
                        justifyContent={"space-between"}
                        sx={{ padding: "0px" }}
                    >
                        <Autocomplete
                            disablePortal
                            id="combo-box-category"
                            isOptionEqualToValue={(option, value) =>
                                option.name === value.name
                            }
                            onChange={(_, newValue) => {
                                setCategorySelect(newValue);
                            }}
                            options={[...categoryList, "All"]}
                            renderInput={(params) => (
                                <TextField {...params} label="Category" />
                            )}
                            sx={{ width: "160px" }}
                            value={categorySelect}
                        />
                        <Autocomplete
                            disablePortal
                            id="combo-box-company"
                            isOptionEqualToValue={(option, value) =>
                                option.name === value.name
                            }
                            onChange={(_, newValue) => {
                                setCompanySelect(newValue);
                            }}
                            options={[...companyList,
                            { desc: "All", name: "All" }
                            ].map(
                                (item) => `${item.name} (${item.desc})`
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Company" />
                            )}
                            sx={{ width: "160px" }}
                            value={companySelect}
                        />
                        <Autocomplete
                            disablePortal
                            getOptionLabel={(option) =>
                                option === "yes"
                                    ? "In Stock"
                                    : option === "no"
                                        ? "Out of Stock"
                                        : "All"
                            }
                            id="combo-box-availability"
                            isOptionEqualToValue={(option, value) =>
                                option.name === value.name
                            }
                            onChange={(_, newValue) => {
                                setAvailability(newValue);
                            }}
                            options={[
                                "All",
                                "yes",
                                "no"]
                            }
                            sx={{ width: "160px" }}
                            renderInput={(params) => (
                                <TextField {...params} label="Availability" />
                            )}
                            value={availability}
                        />
                        <Autocomplete
                            disablePortal
                            getOptionLabel={(option) => option}
                            id="combo-box-sort"
                            isOptionEqualToValue={(option, value) =>
                                option.name === value.name
                            }
                            onChange={(_, newValue) => {
                                setSortOption(newValue);
                            }}
                            options={[
                                "Name",
                                "Price",
                                "Rating",
                                "Discount"]
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Sort By" />
                            )}
                            sx={{ width: "160px" }}
                            value={sortOption}
                        />
                        {sortBasis === "Ascending" ? (
                            <Button
                                disabled={sortOption ? false : true}
                                onClick={() => setSortBasis("Descending")}
                                startIcon={<GoSortDesc
                                    height="100%"
                                    width="100%" />}
                                variant="outlined"
                            >
                                Desc
                            </Button>
                        ) : (
                            <Button
                                disabled={sortOption ? false : true}
                                variant="outlined"
                                startIcon={<GoSortAsc
                                    height="100%"
                                    width="100%" />}
                                onClick={() => setSortBasis("Ascending")}
                            >
                                Asce
                            </Button>
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Stack
                        direction={"row"}
                        justifyContent={"space-around"}
                    >
                        <TextField
                            disabled={!isFilteredApplied() ? true : false}
                            variant="outlined"
                            type="number"
                            label="Min Rating"
                            value={rating}
                            onChange={(event) => {
                                setRating(event.target.value);
                            }}
                        />
                        <TextField
                            disabled={!isFilteredApplied() ? true : false}
                            variant="outlined"
                            type="number"
                            label="Min Price"
                            value={minPrice}
                            onChange={(event) => {
                                setMinPrice(event.target.value);
                            }}
                        />
                        <TextField
                            disabled={!isFilteredApplied() ? true : false}
                            variant="outlined"
                            type="number"
                            label="Max Price"
                            value={maxPrice}
                            onChange={(event) => {
                                setMaxPrice(event.target.value);
                            }}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Grid
                        container
                        spacing={2}
                        justify="space-between"
                        flex={1}
                    >
                        {showData()}
                    </Grid>
                </Grid>
            </Grid>
            <Stack
                direction={"row"}
                justifyContent="center"
            >
                <Pagination
                    count={Math.ceil(productList.length / itemsPerPage)}
                    onChange={handlePageChange}
                    page={currentPage}
                />
            </Stack>
        </Container>
    );
}

export default ProductListNew;
